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
        const known = new Set(entries.map((e) => e.id));
        for (const event of result.events) {
          if (event.type === 'player-drawn') {
            expect(known.has(event.participants[0]!)).toBe(true);
          }
          if (event.type === 'card-resolved' && event.phase === 'phase-1') {
            seenCards.add(event.payload.cardId);
            expect(event.phase).toBe('phase-1');
            expect(['common', 'rare']).toContain(event.payload.rarity);
            expect(new Set(event.participants).size).toBe(event.participants.length);
          }
          const snapshotActive = event.snapshot.filter(
            (player) => player.state !== 'eliminated',
          ).length;
          if ('activeCount' in event.payload)
            expect(event.payload.activeCount).toBe(snapshotActive);
          if (event.type === 'phase-completed')
            expect(snapshotActive).toBe(result.phaseTargets[event.phase]);
        }
        expect(result.players.filter((player) => player.state === 'winner')).toHaveLength(1);
      }
      expect([...seenCards].sort()).toEqual(PHASE_ONE_CARDS.map((c) => c.id).sort());
    },
  );
});
