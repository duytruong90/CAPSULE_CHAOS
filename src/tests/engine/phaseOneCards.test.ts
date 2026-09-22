import { PHASE_ONE_CARDS, phaseOneCardRegistry } from '../../game/cards/phaseOneCards';
import type { CardEffectContext } from '../../game/cards/cardTypes';
import { parseEntries } from '../../game/engine/entryValidation';
import { SeededRng } from '../../game/engine/rng';
import { simulateGame } from '../../game/engine/simulateGame';
import { createGameConfig } from '../../game/state/gameConfig';
import { createInitialPlayer, reducePlayer } from '../../game/state/gameReducer';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';

const config = createGameConfig(DEFAULT_SETUP_CONFIG);
const seed = '1234567890abcdef'.repeat(4);
const roster = (size: number) =>
  parseEntries(Array.from({ length: size }, (_, i) => `Player ${i}`).join('\n'));
function context(): CardEffectContext {
  const players = roster(30).map(createInitialPlayer);
  players[29] = reducePlayer(players[29]!, { type: 'eliminate' }).player;
  return {
    actorId: players[0]!.id,
    rng: new SeededRng(seed),
    targetCount: 20,
    state: { players, config, eventCount: 0, phase: 'phase-1', status: 'running' },
  };
}

describe('Phase 1 cards', () => {
  it.each(['shield', 'second-life'] as const)('%s grants and consumes a direct rescue', (id) => {
    const ctx = context();
    const effect = phaseOneCardRegistry.resolve(id, ctx);
    expect(effect.payload.actions).toEqual([
      { type: 'grant', playerId: ctx.actorId, protection: id },
      { type: 'eliminate', playerId: ctx.actorId },
    ]);
    const granted = reducePlayer(ctx.state.players[0]!, {
      type: 'grant-protection',
      protection: id,
    });
    const result = reducePlayer(granted.player, { type: 'eliminate' });
    expect(result.outcome).toBe(`${id}-consumed`);
    expect(result.player.state).toBe('active');
    expect(result.player.shieldCharges + result.player.secondLifeCharges).toBe(0);
  });
  it('draws two distinct additional active targets and falls back near the boundary', () => {
    const ctx = context();
    const effect = phaseOneCardRegistry.resolve('double-trouble', ctx);
    expect(effect.participants).toHaveLength(3);
    expect(new Set(effect.participants).size).toBe(3);
    expect(effect.participants).not.toContain(ctx.state.players[29]!.id);
    expect(effect.payload.actions.filter((a) => a.type === 'eliminate')).toHaveLength(3);
    expect(phaseOneCardRegistry.resolve('double-trouble', { ...ctx, targetCount: 28 }).cardId).toBe(
      'lucky-escape',
    );
  });
  it('revives the sole eligible eliminated instance, with a safe fallback when none remain', () => {
    const ctx = context();
    const effect = phaseOneCardRegistry.resolve('revive', ctx);
    expect(effect.payload.actions.at(-1)).toEqual({
      type: 'revive',
      playerId: ctx.state.players[29]!.id,
    });
    const exhausted = {
      ...ctx,
      state: { ...ctx.state, players: ctx.state.players.map((p) => ({ ...p, revivalCount: 1 })) },
    };
    expect(phaseOneCardRegistry.resolve('revive', exhausted).cardId).toBe('lucky-escape');
  });
  it('Reverse rescues the current player and marks the next draw; Lucky Escape stores no protection', () => {
    const ctx = context();
    expect(phaseOneCardRegistry.resolve('reverse', ctx).payload.actions).toEqual([
      { type: 'safe', playerId: ctx.actorId },
      { type: 'mark-next' },
    ]);
    expect(phaseOneCardRegistry.resolve('lucky-escape', ctx).payload.actions).toEqual([
      { type: 'safe', playerId: ctx.actorId },
    ]);
  });
  it.each([30, 48, 50, 60, 100])(
    'replays valid resolved targets and exact counts across 100 seeds with %s players',
    (size) => {
      const seenCards = new Set<string>();
      for (let i = 1; i <= 100; i++) {
        const entries = roster(size);
        const result = simulateGame({
          roster: entries,
          config,
          seed: i.toString(16).padStart(64, '0'),
        });
        const active = new Set(entries.map((e) => e.id));
        for (const [index, event] of result.events.entries()) {
          const id = event.participants[0]!;
          if (event.type === 'player-drawn') {
            expect(active.has(id)).toBe(true);
            if (event.payload.marked)
              expect(result.events[index + 1]?.type).toBe('player-eliminated');
          }
          if (event.type === 'card-resolved') {
            seenCards.add(event.payload.cardId);
            expect(event.phase).toBe('phase-1');
            expect(['common', 'rare']).toContain(event.payload.rarity);
            expect(new Set(event.participants).size).toBe(event.participants.length);
          }
          if (event.type === 'player-eliminated') {
            expect(active.delete(id)).toBe(true);
          }
          if (event.type === 'player-revived') {
            expect(active.has(id)).toBe(false);
            active.add(id);
          }
          if ('activeCount' in event.payload) expect(event.payload.activeCount).toBe(active.size);
          if (event.type === 'phase-completed')
            expect(active.size).toBe(result.phaseTargets[event.phase]);
        }
        expect(active.size).toBe(1);
        expect(active.has(result.winnerId)).toBe(true);
      }
      expect([...seenCards].sort()).toEqual(PHASE_ONE_CARDS.map((c) => c.id).sort());
    },
  );
});
