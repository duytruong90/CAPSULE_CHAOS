import { CardEffectRegistry } from '../../game/cards/cardRegistry';
import { parseEntries } from '../../game/engine/entryValidation';
import { calculatePhaseTargets } from '../../game/engine/phaseRules';
import { SeededRng } from '../../game/engine/rng';
import {
  selectEliminatedPlayers,
  selectInPlayPlayers,
  selectUniqueInPlayPlayers,
} from '../../game/engine/selectors';
import { simulateGame, SimulationLimitError } from '../../game/engine/simulateGame';
import { createGameConfig } from '../../game/state/gameConfig';
import { createInitialPlayer, reducePlayer, revivePlayer } from '../../game/state/gameReducer';
import type {
  EngineEventFor,
  GameStateSnapshot,
  SimulationResult,
} from '../../game/state/gameTypes';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';

const config = createGameConfig(DEFAULT_SETUP_CONFIG);

function roster(size: number) {
  return parseEntries(Array.from({ length: size }, (_, index) => `Player ${index + 1}`).join('\n'));
}

function seedFor(index: number) {
  return BigInt(index + 1)
    .toString(16)
    .padStart(64, '0');
}

function simulate(size: number, seedIndex = 0) {
  return simulateGame({ roster: roster(size), config, seed: seedFor(seedIndex) });
}

function assertValidCompletedGame(result: SimulationResult, expectedPlayerCount: number) {
  const winners = result.players.filter((player) => player.state === 'winner');
  const knownIds = new Set(result.players.map((player) => player.id));

  expect(result.completed).toBe(true);
  expect(result.players).toHaveLength(expectedPlayerCount);
  expect(winners).toHaveLength(1);
  expect(winners[0]?.id).toBe(result.winnerId);
  expect(result.players.filter((player) => player.state === 'eliminated')).toHaveLength(
    expectedPlayerCount - 1,
  );
  expect(result.events.length).toBeLessThanOrEqual(config.maxGameEvents);
  result.events.forEach((event, sequence) => {
    expect(event.sequence).toBe(sequence);
    expect(event.participants.every((id) => knownIds.has(id))).toBe(true);
    if ('activeCount' in event.payload) {
      expect(event.payload.activeCount).toBeGreaterThanOrEqual(0);
    }
  });
}

describe('phase targets', () => {
  it.each([
    { size: 8, expected: [8, 8, 5, 3, 2, 1] },
    { size: 20, expected: [12, 10, 5, 3, 2, 1] },
    { size: 30, expected: [20, 10, 5, 3, 2, 1] },
    { size: 48, expected: [20, 10, 5, 3, 2, 1] },
    { size: 60, expected: [20, 10, 5, 3, 2, 1] },
    { size: 100, expected: [20, 10, 5, 3, 2, 1] },
  ])('calculates adaptive targets for $size players', ({ size, expected }) => {
    expect(Object.values(calculatePhaseTargets(size))).toEqual(expected);
  });
});

describe('player reducer and selectors', () => {
  it('consumes shield and second-life charges before elimination', () => {
    const base = createInitialPlayer(roster(1)[0]!);
    const shielded = reducePlayer(base, { type: 'grant-protection', protection: 'shield' }).player;
    const afterShield = reducePlayer(shielded, { type: 'eliminate' });
    const secondLife = reducePlayer(afterShield.player, {
      type: 'grant-protection',
      protection: 'second-life',
    }).player;
    const afterSecondLife = reducePlayer(secondLife, { type: 'eliminate' });
    const eliminated = reducePlayer(afterSecondLife.player, { type: 'eliminate' });

    expect(afterShield.outcome).toBe('shield-consumed');
    expect(afterSecondLife.outcome).toBe('second-life-consumed');
    expect(eliminated.player.state).toBe('eliminated');
    expect(eliminated.player.eliminationCount).toBe(1);
  });

  it('revives only eligible eliminated players within the configured limit', () => {
    const player = createInitialPlayer(roster(1)[0]!);
    const eliminated = reducePlayer(player, { type: 'eliminate' }).player;
    const revived = revivePlayer(eliminated, config).player;

    expect(revived.state).toBe('revived');
    expect(revived.revivalCount).toBe(1);
    expect(() => revivePlayer(revived, config)).toThrow(/not eligible/u);
    const eliminatedAgain = reducePlayer(revived, { type: 'eliminate' }).player;
    expect(() => revivePlayer(eliminatedAgain, config)).toThrow(/not eligible/u);
  });

  it('prevents eliminated players from re-entering play through ordinary state actions', () => {
    const eliminated = reducePlayer(createInitialPlayer(roster(1)[0]!), {
      type: 'eliminate',
    }).player;

    expect(() => reducePlayer(eliminated, { type: 'mark-safe' })).toThrow(/cannot be marked safe/u);
    expect(() => reducePlayer(eliminated, { type: 'activate' })).toThrow(/cannot be activated/u);
    expect(() => reducePlayer(eliminated, { type: 'mark-finalist' })).toThrow(
      /cannot become a finalist/u,
    );
    expect(() => reducePlayer(eliminated, { type: 'declare-winner' })).toThrow(
      /cannot be declared/u,
    );
  });

  it('never selects eliminated players or duplicate participants', () => {
    const players = roster(5).map(createInitialPlayer);
    players[0] = reducePlayer(players[0]!, { type: 'eliminate' }).player;
    const selected = selectUniqueInPlayPlayers(players, 4, new SeededRng(seedFor(7)));

    expect(selectEliminatedPlayers(players).map((player) => player.id)).toEqual(['entry-0001']);
    expect(selectInPlayPlayers(players)).toHaveLength(4);
    expect(selected).toHaveLength(4);
    expect(new Set(selected.map((player) => player.id)).size).toBe(4);
    expect(selected.map((player) => player.id)).not.toContain('entry-0001');
  });
});

describe('baseline simulation', () => {
  it.each([8, 20, 30, 48, 60, 100])('completes a valid game for %s players', (size) => {
    const result = simulate(size, size);
    assertValidCompletedGame(result, size);

    const completedPhases = result.events.filter(
      (event): event is EngineEventFor<'phase-completed'> => event.type === 'phase-completed',
    );
    expect(completedPhases.map((event) => event.payload.activeCount)).toEqual(
      Object.values(result.phaseTargets),
    );
  });

  it('reproduces the exact same result and history for the same input', () => {
    const first = simulate(48, 42);
    const second = simulate(48, 42);

    expect(second).toEqual(first);
    expect(simulate(48, 43).events).not.toEqual(first.events);
  });

  it('uses safe draws during Phase 4 and still converges to three finalists', () => {
    const result = simulate(48, 99);
    const phase4SafeEvents = result.events.filter(
      (event) => event.phase === 'phase-4' && event.type === 'player-safe',
    );
    const phase4Completion = result.events.find(
      (event): event is EngineEventFor<'phase-completed'> =>
        event.phase === 'phase-4' && event.type === 'phase-completed',
    );

    expect(phase4SafeEvents).toHaveLength(3);
    expect(phase4Completion?.payload.activeCount).toBe(3);
  });

  it('throws instead of exceeding the configured hard event cap', () => {
    expect(() =>
      simulateGame({
        roster: roster(30),
        config: { ...config, maxGameEvents: 5 },
        seed: seedFor(1),
      }),
    ).toThrow(SimulationLimitError);
  });

  it('does not consult Math.random for any result', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random is forbidden');
    });

    expect(() => simulate(30, 12)).not.toThrow();
    expect(Math.random).not.toHaveBeenCalled();
  });

  it('terminates 1,000 deterministic games across the primary 30–60 range', () => {
    const rosters = new Map(
      Array.from({ length: 31 }, (_, offset) => {
        const size = 30 + offset;
        return [size, roster(size)] as const;
      }),
    );

    for (let index = 0; index < 1_000; index += 1) {
      const size = 30 + (index % 31);
      const result = simulateGame({
        roster: rosters.get(size)!,
        config,
        seed: seedFor(index + 1_000),
      });
      const winnerCount = result.players.filter((player) => player.state === 'winner').length;

      if (winnerCount !== 1 || result.events.length > config.maxGameEvents) {
        throw new Error(`Invalid simulation at index ${index}.`);
      }
    }
  });
});

describe('card effect registry hooks', () => {
  it('resolves eligible effects and deterministic fallbacks outside React', () => {
    const simulation = simulate(8, 3);
    const state: GameStateSnapshot = {
      phase: 'phase-1',
      status: 'running',
      players: simulation.players,
      eventCount: simulation.events.length,
      config: simulation.config,
    };
    const context = { state, actorId: simulation.winnerId, rng: new SeededRng(seedFor(4)) };
    const registry = new CardEffectRegistry()
      .register({
        id: 'fallback',
        isEligible: () => true,
        resolve: ({ actorId }) => ({ cardId: 'fallback', participants: [actorId], payload: {} }),
      })
      .register({
        id: 'ineligible',
        fallbackCardId: 'fallback',
        isEligible: () => false,
        resolve: () => {
          throw new Error('should not resolve');
        },
      });

    expect(registry.resolve('ineligible', context).cardId).toBe('fallback');
    expect(registry.getEligible(context).map((definition) => definition.id)).toEqual(['fallback']);
  });

  it('rejects card fallback cycles instead of recursing forever', () => {
    const simulation = simulate(8, 5);
    const context = {
      state: {
        phase: 'phase-1' as const,
        status: 'running' as const,
        players: simulation.players,
        eventCount: simulation.events.length,
        config: simulation.config,
      },
      actorId: simulation.winnerId,
      rng: new SeededRng(seedFor(6)),
    };
    const registry = new CardEffectRegistry()
      .register({
        id: 'cycle-a',
        fallbackCardId: 'cycle-b',
        isEligible: () => false,
        resolve: () => ({ cardId: 'cycle-a', participants: [], payload: {} }),
      })
      .register({
        id: 'cycle-b',
        fallbackCardId: 'cycle-a',
        isEligible: () => false,
        resolve: () => ({ cardId: 'cycle-b', participants: [], payload: {} }),
      });

    expect(() => registry.resolve('cycle-a', context)).toThrow(/fallback cycle/u);
  });
});
