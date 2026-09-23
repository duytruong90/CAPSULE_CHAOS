import { ALL_CHAOS_CARDS, chaosCardRegistry } from '../../game/cards/allCards';
import type { CardEffectContext } from '../../game/cards/cardTypes';
import { parseEntries } from '../../game/engine/entryValidation';
import { SeededRng } from '../../game/engine/rng';
import { createGameConfig } from '../../game/state/gameConfig';
import { createInitialPlayer, reducePlayer } from '../../game/state/gameReducer';
import type { GamePhase, Player } from '../../game/state/gameTypes';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';

const seed = '9abcdef012345678'.repeat(4);
const config = createGameConfig(DEFAULT_SETUP_CONFIG);

function context(
  phase: GamePhase,
  activeCount = 10,
  mutate?: (players: Player[]) => void,
): CardEffectContext {
  const players = parseEntries(
    Array.from({ length: 16 }, (_, index) => `Player ${index + 1}`).join('\n'),
  ).map(createInitialPlayer);
  for (let index = activeCount; index < players.length; index += 1) {
    players[index] = reducePlayer(players[index]!, { type: 'eliminate' }).player;
  }
  mutate?.(players);
  return {
    actorId: players[0]!.id,
    rng: new SeededRng(seed),
    targetCount: phase === 'phase-5' ? 2 : 5,
    previousReversibleCardId: 'duel',
    state: { phase, status: 'running', players, eventCount: 0, config },
  };
}

describe('complete V1 Chaos Card catalog', () => {
  it('defines all 16 unique cards with data-driven presentation metadata', () => {
    expect(ALL_CHAOS_CARDS).toHaveLength(16);
    expect(new Set(ALL_CHAOS_CARDS.map((card) => card.id)).size).toBe(16);
    expect(ALL_CHAOS_CARDS.every((card) => card.presentationKey === `card.${card.id}`)).toBe(true);
  });

  it.each([
    ['shield', 'phase-3'],
    ['second-life', 'phase-3'],
    ['double-trouble', 'phase-3'],
    ['revive', 'phase-3'],
    ['reverse', 'phase-3'],
    ['lucky-escape', 'phase-3'],
    ['mirror', 'phase-3'],
    ['chaos-bomb', 'phase-3'],
    ['duel', 'phase-3'],
    ['steal', 'phase-3'],
    ['nullify', 'phase-3'],
    ['final-pass', 'phase-3'],
    ['ghost-return', 'phase-3'],
    ['fate-swap', 'phase-3'],
    ['system-override', 'phase-3'],
    ['jackpot', 'phase-5'],
  ] as const)('%s has an eligible deterministic resolution', (cardId, phase) => {
    const result = chaosCardRegistry.resolve(cardId, context(phase, phase === 'phase-5' ? 3 : 10));
    expect(result.participants[0]).toBe('entry-0001');
    expect(result.payload.actions.length).toBeGreaterThan(0);
  });

  it('redirects Mirror into normal protection resolution and keeps the actor safe', () => {
    const ctx = context('phase-3', 2, (players) => {
      players[1] = reducePlayer(players[1]!, {
        type: 'grant-protection',
        protection: 'shield',
      }).player;
    });
    const result = chaosCardRegistry.resolve('mirror', { ...ctx, targetCount: 1 });
    const redirected = result.payload.actions.find((action) => action.type === 'eliminate');
    expect(redirected).toEqual({ type: 'eliminate', playerId: 'entry-0002' });
    const target = ctx.state.players[1]!;
    expect(reducePlayer(target, { type: 'eliminate' }).outcome).toBe('shield-consumed');
  });

  it('lets Second Life protect a deterministic Duel loser', () => {
    const ctx = context('phase-3', 2, (players) => {
      players.forEach((player, index) => {
        if (index < 2) {
          players[index] = reducePlayer(player, {
            type: 'grant-protection',
            protection: 'second-life',
          }).player;
        }
      });
    });
    const duel = chaosCardRegistry.resolve('duel', { ...ctx, targetCount: 1 });
    const action = duel.payload.actions.find((entry) => entry.type === 'duel');
    expect(action?.type).toBe('duel');
    if (action?.type === 'duel') {
      const loser = ctx.state.players.find((player) => player.id === action.loserId)!;
      expect(reducePlayer(loser, { type: 'eliminate' }).outcome).toBe('second-life-consumed');
    }
  });

  it('uses Lucky Escape as the explicit Steal fallback', () => {
    const result = chaosCardRegistry.resolve('steal', context('phase-3'));
    expect(result.cardId).toBe('lucky-escape');
    expect(result.payload.actions).toEqual([{ type: 'safe', playerId: 'entry-0001' }]);
  });

  it('transfers only a stealable charge when one exists', () => {
    const ctx = context('phase-3', 10, (players) => {
      players[1] = reducePlayer(players[1]!, {
        type: 'grant-protection',
        protection: 'shield',
      }).player;
    });
    const result = chaosCardRegistry.resolve('steal', ctx);
    expect(result.cardId).toBe('steal');
    expect(result.payload.actions[0]).toEqual({
      type: 'steal',
      fromPlayerId: 'entry-0002',
      toPlayerId: 'entry-0001',
      protection: 'shield',
    });
  });

  it('requires an immediately reversible event for Nullify', () => {
    const eligible = context('phase-3');
    const ineligible: CardEffectContext = {
      actorId: eligible.actorId,
      rng: eligible.rng,
      ...(eligible.targetCount === undefined ? {} : { targetCount: eligible.targetCount }),
      state: eligible.state,
    };
    expect(chaosCardRegistry.get('nullify')?.isEligible(eligible)).toBe(true);
    expect(chaosCardRegistry.get('nullify')?.isEligible(ineligible)).toBe(false);
    expect(chaosCardRegistry.resolve('nullify', eligible).payload.actions[0]).toEqual({
      type: 'nullify-previous',
    });
  });

  it('keeps Jackpot a survival effect when double-winner mode is off', () => {
    const result = chaosCardRegistry.resolve('jackpot', context('phase-5', 3));
    expect(result.payload.resultText).toBe('MAXIMUM SURVIVAL');
    expect(result.payload.actions.some((action) => action.type === 'safe')).toBe(true);
  });
});
