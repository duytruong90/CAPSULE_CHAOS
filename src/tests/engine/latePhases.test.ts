import { parseEntries } from '../../game/engine/entryValidation';
import { simulateGame } from '../../game/engine/simulateGame';
import { createGameConfig } from '../../game/state/gameConfig';
import type { FakeoutType, FinalFateOutcome } from '../../game/state/gameTypes';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';
import { buildTimeline } from '../../game/timeline/buildTimeline';

const roster = parseEntries(
  Array.from({ length: 48 }, (_, index) => `Player ${index + 1}`).join('\n'),
);
const seedFor = (index: number) =>
  BigInt(index + 1)
    .toString(16)
    .padStart(64, '0');

function simulate(index: number, fakeoutIntensity = DEFAULT_SETUP_CONFIG.fakeoutIntensity) {
  return simulateGame({
    roster,
    seed: seedFor(index),
    config: createGameConfig({ ...DEFAULT_SETUP_CONFIG, fakeoutIntensity }),
  });
}

describe('late phase deterministic flow', () => {
  it('converges at every target, expires Final Pass, and caps Legendary cards', () => {
    for (let index = 0; index < 250; index += 1) {
      const result = simulate(index);
      const completions = result.events.filter((event) => event.type === 'phase-completed');
      expect(completions.map((event) => event.payload.activeCount)).toEqual([20, 10, 5, 3, 2, 1]);
      const legendary = result.events.filter(
        (event) => event.type === 'card-resolved' && event.payload.rarity === 'legendary',
      );
      expect(legendary.length).toBeLessThanOrEqual(2);
      expect(legendary.filter((event) => event.phase === 'phase-5')).toHaveLength(
        legendary.some((event) => event.phase === 'phase-5') ? 1 : 0,
      );
      const phaseStarts = result.events.filter((event) => event.type === 'phase-started');
      phaseStarts.slice(1).forEach((event) => {
        expect(event.snapshot.some((player) => player.lockedUntilPhase)).toBe(false);
      });
    }
  });

  it('exercises every allowed Final Fate branch and always hands off exactly two IDs', () => {
    const outcomes = new Set<FinalFateOutcome>();
    for (let index = 0; index < 500 && outcomes.size < 6; index += 1) {
      const result = simulate(index + 700);
      const event = result.events.find((candidate) => candidate.type === 'final-fate-resolved');
      expect(event).toBeDefined();
      if (event?.type === 'final-fate-resolved') {
        outcomes.add(event.payload.outcome);
        expect(event.payload.advancingPlayerIds).toHaveLength(2);
        expect(new Set(event.payload.advancingPlayerIds).size).toBe(2);
      }
    }
    expect([...outcomes].sort()).toEqual(
      ['normal', 'reverse', 'duel', 'system-override', 'revival-challenge', 'fate-swap'].sort(),
    );
  });

  it('precomputes all four high-intensity fake-outs without changing the locked winner', () => {
    const variants = new Set<FakeoutType>();
    for (let index = 0; index < 200 && variants.size < 4; index += 1) {
      const high = simulate(index + 1400, 'high');
      const standard = simulate(index + 1400, 'standard');
      const low = simulate(index + 1400, 'low');
      const chamber = high.events.find((event) => event.type === 'final-chamber-ready');
      if (chamber?.type === 'final-chamber-ready') variants.add(chamber.payload.fakeoutType);
      expect(high.winnerId).toBe(standard.winnerId);
      expect(high.winnerId).toBe(low.winnerId);
    }
    expect([...variants].sort()).toEqual(
      ['false-celebration', 'recalculation', 'capsule-refusal', 'double-reveal'].sort(),
    );
  });

  it('keeps presentation-only near misses paired to the resolved draw participant', () => {
    const timeline = buildTimeline(simulate(2222));
    const nearMisses = timeline.events.filter(
      (event) => event.type === 'capsule-spin' && event.payload.nearMiss,
    );
    expect(nearMisses.length).toBeGreaterThan(0);
    nearMisses.forEach((spin) => {
      const reveal = timeline.events[spin.sequence + 1];
      expect(reveal?.type).toBe('player-reveal');
      expect(reveal?.participants).toEqual(spin.participants);
    });
  });
});
