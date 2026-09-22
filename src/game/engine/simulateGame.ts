import { normalizeSeed } from './seed';
import { SeededRng } from './rng';
import { calculatePhaseTargets } from './phaseRules';
import { isPlayerInPlay, selectInPlayPlayers, selectRandomInPlayPlayer } from './selectors';
import { appendPlayerHistory, createInitialPlayer, reducePlayer } from '../state/gameReducer';
import {
  ENGINE_RULES_VERSION,
  type DrawRule,
  type EngineEvent,
  type EngineEventFor,
  type EngineEventPayloadByType,
  type EngineEventType,
  type GamePhase,
  type Player,
  type PlayerHistoryEventType,
  type SimulationInput,
  type SimulationResult,
} from '../state/gameTypes';

type StandardPhase = Exclude<GamePhase, 'phase-4'>;

export class SimulationLimitError extends Error {
  constructor(limit: number) {
    super(`Simulation exceeded the hard event cap of ${limit}.`);
    this.name = 'SimulationLimitError';
  }
}

export function simulateGame(input: SimulationInput): SimulationResult {
  const seed = normalizeSeed(input.seed);
  const config = { ...input.config };
  const phaseTargets = calculatePhaseTargets(input.roster.length);
  const rng = new SeededRng(seed);
  const playersById = new Map(
    input.roster.map((entry) => [entry.id, createInitialPlayer(entry)] as const),
  );
  const events: EngineEvent[] = [];

  if (playersById.size !== input.roster.length) {
    throw new Error('Roster contains duplicate player IDs.');
  }

  const players = () =>
    Array.from(playersById.values()).sort((left, right) => left.entryIndex - right.entryIndex);
  const inPlayPlayers = () => selectInPlayPlayers(players());
  const getPlayer = (playerId: string) => {
    const player = playersById.get(playerId);
    if (!player) throw new Error(`Unknown player reference: ${playerId}.`);
    return player;
  };
  const setPlayer = (player: Player) => playersById.set(player.id, player);

  const emit = <Type extends EngineEventType>(
    phase: GamePhase,
    type: Type,
    participants: readonly string[],
    payload: EngineEventPayloadByType[Type],
  ): EngineEventFor<Type> => {
    if (events.length >= config.maxGameEvents) {
      throw new SimulationLimitError(config.maxGameEvents);
    }
    participants.forEach(getPlayer);
    const sequence = events.length;
    const event = Object.freeze({
      id: `engine-${String(sequence + 1).padStart(4, '0')}`,
      sequence,
      phase,
      type,
      participants: Object.freeze([...participants]),
      payload: Object.freeze({ ...payload }),
    }) as EngineEventFor<Type>;
    events.push(event as EngineEvent);
    return event;
  };

  const recordHistory = (playerId: string, event: EngineEvent, type: PlayerHistoryEventType) => {
    const player = getPlayer(playerId);
    setPlayer(
      appendPlayerHistory(player, {
        eventId: event.id,
        sequence: event.sequence,
        phase: event.phase,
        type,
      }),
    );
  };

  const drawPlayer = (phase: GamePhase, drawRule: DrawRule, candidates?: readonly Player[]) => {
    const selected = candidates ? rng.choose(candidates) : selectRandomInPlayPlayer(players(), rng);
    const event = emit(phase, 'player-drawn', [selected.id], {
      drawRule,
      activeCount: inPlayPlayers().length,
    });
    recordHistory(selected.id, event, 'drawn');
    return getPlayer(selected.id);
  };

  const eliminatePlayer = (phase: GamePhase, playerId: string) => {
    const transition = reducePlayer(getPlayer(playerId), { type: 'eliminate' });
    setPlayer(transition.player);

    if (transition.outcome === 'shield-consumed' || transition.outcome === 'second-life-consumed') {
      const protection = transition.outcome === 'shield-consumed' ? 'shield' : 'second-life';
      const remainingCharges =
        protection === 'shield'
          ? transition.player.shieldCharges
          : transition.player.secondLifeCharges;
      const event = emit(phase, 'protection-consumed', [playerId], {
        protection,
        remainingCharges,
      });
      recordHistory(playerId, event, transition.outcome);
      return;
    }

    const event = emit(phase, 'player-eliminated', [playerId], {
      activeCount: inPlayPlayers().length,
      eliminationCount: transition.player.eliminationCount,
    });
    recordHistory(playerId, event, 'eliminated');
  };

  const completePhase = (phase: GamePhase, targetCount: number) => {
    const event = emit(phase, 'phase-completed', [], {
      activeCount: inPlayPlayers().length,
      targetCount,
    });
    return event;
  };

  const runStandardPhase = (phase: StandardPhase, targetCount: number) => {
    emit(phase, 'phase-started', [], {
      activeCount: inPlayPlayers().length,
      targetCount,
    });

    while (inPlayPlayers().length > targetCount) {
      const selected = drawPlayer(phase, 'eliminate');
      eliminatePlayer(phase, selected.id);
    }

    const completion = completePhase(phase, targetCount);

    if (phase === 'phase-1' || phase === 'phase-2' || phase === 'phase-3') {
      inPlayPlayers().forEach((player) => {
        if (player.state !== 'active') {
          setPlayer(reducePlayer(player, { type: 'activate' }).player);
        }
      });
    } else if (phase === 'phase-5') {
      inPlayPlayers().forEach((player) => {
        const finalist = reducePlayer(player, { type: 'mark-finalist' }).player;
        setPlayer(
          appendPlayerHistory(finalist, {
            eventId: completion.id,
            sequence: completion.sequence,
            phase,
            type: 'finalist',
          }),
        );
      });
    }
  };

  const runSafeDrawPhase = () => {
    const phase: GamePhase = 'phase-4';
    const targetCount = phaseTargets[phase];
    emit(phase, 'phase-started', [], {
      activeCount: inPlayPlayers().length,
      targetCount,
    });

    const dangerIds = new Set(inPlayPlayers().map((player) => player.id));
    const safeIds = new Set<string>();

    while (safeIds.size < targetCount) {
      const candidates = Array.from(dangerIds, getPlayer);
      const selected = drawPlayer(phase, 'safe', candidates);
      const safePlayer = reducePlayer(selected, { type: 'mark-safe' }).player;
      setPlayer(safePlayer);
      dangerIds.delete(selected.id);
      safeIds.add(selected.id);
      const event = emit(phase, 'player-safe', [selected.id], {
        activeCount: inPlayPlayers().length,
      });
      recordHistory(selected.id, event, 'safe');
    }

    Array.from(dangerIds).forEach((playerId) => eliminatePlayer(phase, playerId));
    const completion = completePhase(phase, targetCount);

    safeIds.forEach((playerId) => {
      const finalist = reducePlayer(getPlayer(playerId), { type: 'mark-finalist' }).player;
      setPlayer(
        appendPlayerHistory(finalist, {
          eventId: completion.id,
          sequence: completion.sequence,
          phase,
          type: 'finalist',
        }),
      );
    });
  };

  runStandardPhase('phase-1', phaseTargets['phase-1']);
  runStandardPhase('phase-2', phaseTargets['phase-2']);
  runStandardPhase('phase-3', phaseTargets['phase-3']);
  runSafeDrawPhase();
  runStandardPhase('phase-5', phaseTargets['phase-5']);
  runStandardPhase('final', phaseTargets.final);

  const finalists = inPlayPlayers();
  if (finalists.length !== 1) {
    throw new Error(`Simulation ended with ${finalists.length} in-play players instead of one.`);
  }

  const winnerTransition = reducePlayer(finalists[0] as Player, { type: 'declare-winner' });
  setPlayer(winnerTransition.player);
  const winnerEvent = emit('final', 'winner-declared', [winnerTransition.player.id], {
    activeCount: 1,
  });
  recordHistory(winnerTransition.player.id, winnerEvent, 'winner');

  const finalPlayers = players().map((player) =>
    Object.freeze({
      ...player,
      history: Object.freeze(player.history.map((event) => Object.freeze({ ...event }))),
    }),
  ) as readonly Player[];

  if (finalPlayers.some((player) => player.state !== 'eliminated' && !isPlayerInPlay(player))) {
    throw new Error('Simulation produced an invalid player state.');
  }

  return Object.freeze({
    rulesVersion: ENGINE_RULES_VERSION,
    seed,
    config: Object.freeze(config),
    phaseTargets: Object.freeze({ ...phaseTargets }),
    players: Object.freeze(finalPlayers),
    events: Object.freeze([...events]),
    winnerId: winnerTransition.player.id,
    completed: true,
  });
}
