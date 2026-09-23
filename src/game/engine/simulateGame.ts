import {
  ALL_CHAOS_CARDS,
  cardById,
  chaosCardRegistry,
  eligibleCards,
  type CardAction,
} from '../cards/allCards';
import {
  appendPlayerHistory,
  canRevivePlayer,
  createInitialPlayer,
  reducePlayer,
} from '../state/gameReducer';
import {
  ENGINE_RULES_VERSION,
  type DrawRule,
  type EngineEvent,
  type EngineEventFor,
  type EngineEventPayloadByType,
  type EngineEventType,
  type FakeoutType,
  type FinalFateOutcome,
  type GamePhase,
  type Player,
  type PlayerHistoryEventType,
  type PlayerStatusSnapshot,
  type SimulationInput,
  type SimulationResult,
} from '../state/gameTypes';
import { calculatePhaseTargets } from './phaseRules';
import { SeededRng } from './rng';
import { normalizeSeed } from './seed';
import { isPlayerInPlay, selectInPlayPlayers } from './selectors';

type StandardPhase = 'phase-1' | 'phase-2' | 'phase-3';

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
  const playersById = new Map(input.roster.map((entry) => [entry.id, createInitialPlayer(entry)]));
  const events: EngineEvent[] = [];
  let nextDrawMarked = false;
  let legendaryCount = 0;
  let finalSequenceLegendaryCount = 0;

  if (playersById.size !== input.roster.length) {
    throw new Error('Roster contains duplicate player IDs.');
  }

  const players = () =>
    [...playersById.values()].sort((left, right) => left.entryIndex - right.entryIndex);
  const inPlay = () => selectInPlayPlayers(players());
  const getPlayer = (id: string) => {
    const player = playersById.get(id);
    if (!player) throw new Error(`Unknown player reference: ${id}.`);
    return player;
  };
  const setPlayer = (player: Player) => playersById.set(player.id, player);
  const snapshot = (): readonly PlayerStatusSnapshot[] =>
    Object.freeze(
      players().map((player) =>
        Object.freeze({
          id: player.id,
          state: player.state,
          shieldCharges: player.shieldCharges,
          secondLifeCharges: player.secondLifeCharges,
          ...(player.lockedUntilPhase ? { lockedUntilPhase: player.lockedUntilPhase } : {}),
          revivalCount: player.revivalCount,
        }),
      ),
    );

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
    const event = Object.freeze({
      id: `engine-${String(events.length + 1).padStart(4, '0')}`,
      sequence: events.length,
      phase,
      type,
      participants: Object.freeze([...participants]),
      payload: Object.freeze({ ...payload }),
      snapshot: snapshot(),
    }) as EngineEventFor<Type>;
    events.push(event as EngineEvent);
    return event;
  };

  const record = (playerId: string, event: EngineEvent, type: PlayerHistoryEventType) => {
    setPlayer(
      appendPlayerHistory(getPlayer(playerId), {
        eventId: event.id,
        sequence: event.sequence,
        phase: event.phase,
        type,
      }),
    );
  };

  const draw = (
    phase: GamePhase,
    rule: DrawRule,
    candidates?: readonly Player[],
    marked = false,
    firstSafeDraw = false,
  ) => {
    const eligible = (candidates ?? inPlay()).filter((player) => !player.lockedUntilPhase);
    if (!eligible.length) throw new Error(`Phase ${phase} has no eligible draw target.`);
    const selected = rng.choose(eligible);
    const event = emit(phase, 'player-drawn', [selected.id], {
      drawRule: rule,
      activeCount: inPlay().length,
      marked,
      nearMiss: phase === 'phase-3' && rng.nextFloat() < 0.28,
      firstSafeDraw,
    });
    record(selected.id, event, 'drawn');
    return getPlayer(selected.id);
  };

  const eliminate = (phase: GamePhase, playerId: string) => {
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
      record(playerId, event, transition.outcome);
      return false;
    }
    const event = emit(phase, 'player-eliminated', [playerId], {
      activeCount: inPlay().length,
      eliminationCount: transition.player.eliminationCount,
    });
    record(playerId, event, 'eliminated');
    return true;
  };

  const markSafe = (phase: GamePhase, playerId: string) => {
    setPlayer(reducePlayer(getPlayer(playerId), { type: 'mark-safe' }).player);
    const event = emit(phase, 'player-safe', [playerId], { activeCount: inPlay().length });
    record(playerId, event, 'safe');
  };

  const revive = (phase: GamePhase, playerId: string) => {
    const revived = reducePlayer(getPlayer(playerId), {
      type: 'revive',
      maxRevivals: config.maxPlayerRevivals,
    }).player;
    setPlayer(revived);
    const event = emit(phase, 'player-revived', [playerId], {
      activeCount: inPlay().length,
      revivalCount: revived.revivalCount,
    });
    record(playerId, event, 'revived');
  };

  const restore = (saved: readonly Player[], phase: GamePhase, cardId: string) => {
    for (const previous of saved) {
      const current = getPlayer(previous.id);
      setPlayer({ ...previous, history: current.history });
    }
    emit(
      phase,
      'state-restored',
      saved.map((player) => player.id),
      { cardId, activeCount: inPlay().length },
    );
  };

  const applyActions = (
    phase: GamePhase,
    actions: readonly CardAction[],
    reversibleSnapshot?: readonly Player[],
    reversibleCardId?: string,
  ) => {
    for (const action of actions) {
      switch (action.type) {
        case 'mark-next':
          nextDrawMarked = true;
          break;
        case 'grant': {
          const granted = reducePlayer(getPlayer(action.playerId), {
            type: 'grant-protection',
            protection: action.protection,
          }).player;
          setPlayer(granted);
          const event = emit(phase, 'protection-granted', [action.playerId], {
            protection: action.protection,
            charges: 1,
          });
          record(action.playerId, event, 'protected');
          break;
        }
        case 'steal': {
          const from = getPlayer(action.fromPlayerId);
          const key = action.protection === 'shield' ? 'shieldCharges' : 'secondLifeCharges';
          if (from[key] <= 0) throw new Error(`Cannot steal missing ${action.protection}.`);
          setPlayer({ ...from, [key]: from[key] - 1 });
          const to = reducePlayer(getPlayer(action.toPlayerId), {
            type: 'grant-protection',
            protection: action.protection,
          }).player;
          setPlayer(to);
          emit(phase, 'protection-granted', [action.toPlayerId, action.fromPlayerId], {
            protection: action.protection,
            charges: 1,
            sourcePlayerId: action.fromPlayerId,
          });
          break;
        }
        case 'lock': {
          setPlayer(
            reducePlayer(getPlayer(action.playerId), {
              type: 'lock-until-phase',
              phase,
            }).player,
          );
          const event = emit(phase, 'player-phase-locked', [action.playerId], {
            untilPhase: phase,
          });
          record(action.playerId, event, 'phase-locked');
          break;
        }
        case 'draw':
          draw(phase, 'eliminate', [getPlayer(action.playerId)]);
          break;
        case 'eliminate':
          eliminate(phase, action.playerId);
          break;
        case 'safe':
          markSafe(phase, action.playerId);
          break;
        case 'revive':
          revive(phase, action.playerId);
          break;
        case 'duel':
          emit(phase, 'duel-resolved', [action.winnerId, action.loserId], {
            winnerId: action.winnerId,
            loserId: action.loserId,
          });
          markSafe(phase, action.winnerId);
          eliminate(phase, action.loserId);
          break;
        case 'nullify-previous':
          if (!reversibleSnapshot || !reversibleCardId) {
            throw new Error('Nullify has no reversible event to restore.');
          }
          restore(reversibleSnapshot, phase, reversibleCardId);
          break;
      }
    }
  };

  const clearBoundaryStatuses = () => {
    for (const player of inPlay()) {
      let next = player;
      if (next.lockedUntilPhase) {
        next = reducePlayer(next, { type: 'clear-phase-lock' }).player;
      }
      if (next.state !== 'active') next = reducePlayer(next, { type: 'activate' }).player;
      setPlayer(next);
    }
  };

  const completePhase = (phase: GamePhase, targetCount: number) =>
    emit(phase, 'phase-completed', [], { activeCount: inPlay().length, targetCount });

  const runStandardPhase = (phase: StandardPhase, targetCount: number) => {
    emit(phase, 'phase-started', [], { activeCount: inPlay().length, targetCount });
    let stagnantTurns = 0;
    let previousReversible: { cardId: string; state: readonly Player[] } | undefined;
    const chaosChance = phase === 'phase-1' ? 0.2 : phase === 'phase-2' ? 0.35 : 0.45;

    while (inPlay().length > targetCount) {
      const beforeCount = inPlay().length;
      const marked = nextDrawMarked;
      nextDrawMarked = false;
      const selected = draw(phase, 'eliminate', undefined, marked);
      const forceStandard = marked || stagnantTurns >= 8 || rng.nextFloat() >= chaosChance;
      if (forceStandard) {
        eliminate(phase, selected.id);
        previousReversible = undefined;
      } else {
        const context = {
          actorId: selected.id,
          rng,
          targetCount,
          ...(previousReversible ? { previousReversibleCardId: previousReversible.cardId } : {}),
          state: {
            phase,
            status: 'running' as const,
            players: players(),
            eventCount: events.length,
            config,
          },
        };
        let eligible = eligibleCards(context, legendaryCount);
        if (phase === 'phase-1') {
          eligible = eligible.filter((entry) => entry.phasesAllowed.includes('phase-1'));
        }
        if (phase === 'phase-2') {
          eligible = eligible.filter((entry) => entry.rarity !== 'legendary');
        }
        if (phase === 'phase-3' && legendaryCount >= 1) {
          eligible = eligible.filter((entry) => entry.rarity !== 'legendary');
        }
        if (!eligible.length) {
          eliminate(phase, selected.id);
          previousReversible = undefined;
        } else {
          const chosen = rng.weightedChoice(
            eligible.map((value) => ({ value, weight: value.weight })),
          );
          const beforeCard = players().map((player) => ({
            ...player,
            history: [...player.history],
          }));
          const resolution = chaosCardRegistry.resolve(chosen.id, context);
          const resolvedDefinition = cardById(resolution.cardId)!;
          if (resolvedDefinition.rarity === 'legendary') legendaryCount += 1;
          emit(phase, 'card-resolved', resolution.participants, {
            cardId: resolvedDefinition.id,
            name: resolvedDefinition.name,
            rarity: resolvedDefinition.rarity,
            description: resolvedDefinition.description,
            presentationKey: resolvedDefinition.presentationKey,
            resultText: resolution.payload.resultText,
          });
          applyActions(
            phase,
            resolution.payload.actions,
            previousReversible?.state,
            previousReversible?.cardId,
          );
          const reversible = ['double-trouble', 'mirror', 'duel', 'chaos-bomb'].includes(
            resolvedDefinition.id,
          );
          previousReversible = reversible
            ? { cardId: resolvedDefinition.id, state: beforeCard }
            : undefined;
        }
      }
      stagnantTurns = inPlay().length >= beforeCount ? stagnantTurns + 1 : 0;
    }
    completePhase(phase, targetCount);
    clearBoundaryStatuses();
  };

  const eliminateFully = (phase: GamePhase, id: string) => {
    while (isPlayerInPlay(getPlayer(id))) eliminate(phase, id);
  };

  const runFinalFive = () => {
    const phase: GamePhase = 'phase-4';
    const target = phaseTargets[phase];
    emit(phase, 'phase-started', [], { activeCount: inPlay().length, targetCount: target });
    const danger = new Set(inPlay().map((player) => player.id));
    const safe = new Set<string>();
    while (safe.size < target) {
      const selected = draw(phase, 'safe', [...danger].map(getPlayer), false, safe.size === 0);
      markSafe(phase, selected.id);
      danger.delete(selected.id);
      safe.add(selected.id);
    }
    for (const id of danger) eliminateFully(phase, id);
    const completion = completePhase(phase, target);
    safe.forEach((id) => {
      const finalist = reducePlayer(getPlayer(id), { type: 'mark-finalist' }).player;
      setPlayer(
        appendPlayerHistory(finalist, {
          eventId: completion.id,
          sequence: completion.sequence,
          phase,
          type: 'finalist',
        }),
      );
    });
    clearBoundaryStatuses();
  };

  const emitFinalFateCard = (
    phase: GamePhase,
    id: string,
    participants: readonly string[],
    resultText: string,
  ) => {
    const definition = cardById(id);
    if (!definition) return;
    if (definition.rarity === 'legendary') {
      legendaryCount += 1;
      finalSequenceLegendaryCount += 1;
    }
    emit(phase, 'card-resolved', participants, {
      cardId: definition.id,
      name: definition.name,
      rarity: definition.rarity,
      description: definition.description,
      presentationKey: definition.presentationKey,
      resultText,
    });
  };

  const runFinalFate = () => {
    const phase: GamePhase = 'phase-5';
    emit(phase, 'phase-started', [], { activeCount: inPlay().length, targetCount: 2 });
    const initial = inPlay();
    const actor = rng.choose(initial);
    let outcome = rng.choose<FinalFateOutcome>([
      'normal',
      'reverse',
      'duel',
      'system-override',
      'revival-challenge',
      'fate-swap',
    ]);
    if (
      outcome === 'revival-challenge' &&
      !players().some((player) => canRevivePlayer(player, config))
    ) {
      outcome = 'duel';
    }
    if (
      outcome === 'system-override' &&
      (legendaryCount >= 2 || finalSequenceLegendaryCount >= 1)
    ) {
      outcome = 'reverse';
    }
    const others = () => inPlay().filter((player) => player.id !== actor.id);
    const eliminatedIds: string[] = [];

    if (outcome === 'normal') {
      eliminateFully(phase, actor.id);
      eliminatedIds.push(actor.id);
    } else if (outcome === 'reverse' || outcome === 'fate-swap') {
      const target = rng.choose(others());
      emitFinalFateCard(
        phase,
        outcome === 'reverse' ? 'reverse' : 'fate-swap',
        [actor.id, target.id],
        outcome === 'reverse' ? 'FINAL FATE REVERSED' : 'FATE SWAPPED',
      );
      markSafe(phase, actor.id);
      eliminateFully(phase, target.id);
      eliminatedIds.push(target.id);
    } else if (outcome === 'duel') {
      const opponent = rng.choose(others());
      const winnerId = rng.choose([actor.id, opponent.id]);
      const loserId = winnerId === actor.id ? opponent.id : actor.id;
      emitFinalFateCard(phase, 'duel', [actor.id, opponent.id], 'FINAL DUEL');
      emit(phase, 'duel-resolved', [winnerId, loserId], { winnerId, loserId });
      eliminateFully(phase, loserId);
      eliminatedIds.push(loserId);
    } else if (outcome === 'system-override') {
      const target = rng.choose(others());
      emitFinalFateCard(
        phase,
        'system-override',
        [actor.id, target.id],
        'OVERRIDE · REPLACEMENT FATE',
      );
      markSafe(phase, actor.id);
      eliminateFully(phase, target.id);
      eliminatedIds.push(target.id);
    } else {
      const ghost = rng.choose(players().filter((player) => canRevivePlayer(player, config)));
      revive(phase, ghost.id);
      const challenged = actor;
      const challengeWinner = rng.choose([ghost.id, challenged.id]);
      const challengeLoser = challengeWinner === ghost.id ? challenged.id : ghost.id;
      emitFinalFateCard(phase, 'ghost-return', [ghost.id, challenged.id], 'REVIVAL CHALLENGE');
      emit(phase, 'duel-resolved', [challengeWinner, challengeLoser], {
        winnerId: challengeWinner,
        loserId: challengeLoser,
      });
      eliminateFully(phase, challengeLoser);
      eliminatedIds.push(challengeLoser);
      const lastTarget = rng.choose(inPlay().filter((player) => player.id !== challengeWinner));
      eliminateFully(phase, lastTarget.id);
      eliminatedIds.push(lastTarget.id);
    }
    if (inPlay().length !== 2) {
      throw new Error(`Final Fate resolved to ${inPlay().length} players.`);
    }
    const advancing = inPlay().map((player) => player.id);
    emit(phase, 'final-fate-resolved', [...advancing, ...eliminatedIds], {
      outcome,
      advancingPlayerIds: advancing,
      eliminatedPlayerIds: eliminatedIds,
    });
    const completion = completePhase(phase, 2);
    advancing.forEach((id) => {
      const finalist = reducePlayer(getPlayer(id), { type: 'mark-finalist' }).player;
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

  const chooseFakeout = (): FakeoutType => {
    if (config.fakeoutIntensity === 'low') {
      return rng.weightedChoice([
        { value: 'none' as const, weight: 3 },
        { value: 'capsule-refusal' as const, weight: 1 },
      ]);
    }
    const variants: FakeoutType[] = [
      'false-celebration',
      'recalculation',
      'capsule-refusal',
      'double-reveal',
    ];
    if (config.fakeoutIntensity === 'standard') variants.push('none');
    return rng.choose(variants);
  };

  const runFinal = () => {
    const phase: GamePhase = 'final';
    emit(phase, 'phase-started', [], { activeCount: 2, targetCount: 1 });
    const finalists = inPlay();
    const winner = rng.choose(finalists);
    const loser = finalists.find((player) => player.id !== winner.id)!;
    const fakeoutType = chooseFakeout();
    const apparentWinnerId = fakeoutType === 'false-celebration' ? loser.id : winner.id;
    emit(phase, 'final-chamber-ready', [winner.id, loser.id], {
      winnerId: winner.id,
      loserId: loser.id,
      fakeoutType,
      apparentWinnerId,
    });
    eliminateFully(phase, loser.id);
    completePhase(phase, 1);
    const transition = reducePlayer(getPlayer(winner.id), { type: 'declare-winner' });
    setPlayer(transition.player);
    const winnerEvent = emit(phase, 'winner-declared', [winner.id], { activeCount: 1 });
    record(winner.id, winnerEvent, 'winner');
    return winner.id;
  };

  runStandardPhase('phase-1', phaseTargets['phase-1']);
  runStandardPhase('phase-2', phaseTargets['phase-2']);
  runStandardPhase('phase-3', phaseTargets['phase-3']);
  runFinalFive();
  runFinalFate();
  const winnerId = runFinal();

  const finalPlayers = players().map((player) =>
    Object.freeze({
      ...player,
      history: Object.freeze(player.history.map((history) => Object.freeze({ ...history }))),
    }),
  ) as readonly Player[];
  if (finalPlayers.filter((player) => player.state === 'winner').length !== 1) {
    throw new Error('Simulation must produce exactly one official winner.');
  }
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
    winnerId,
    completed: true,
  });
}

export { ALL_CHAOS_CARDS };
