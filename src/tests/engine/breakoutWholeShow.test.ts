import { describe, expect, it } from 'vitest';
import { simulateBreakout } from '../../game/breakout/simulateBreakout';
import type { BreakoutEntry, BreakoutRandomSeeds } from '../../game/breakout/types';

function entries(count: number): BreakoutEntry[] {
  return Array.from({ length: count }, (_, entryIndex) => ({
    id: `entry-${entryIndex + 1}`,
    displayName: `Player ${entryIndex + 1}`,
    normalizedName: `Player ${entryIndex + 1}`,
    entryIndex,
  }));
}

function seeds(sample: number): BreakoutRandomSeeds {
  const value = sample.toString(16).padStart(64, '0');
  return {
    floor: value,
    'race-decks': value,
    'race-photo': value,
    bracket: value,
    'clash-sf1': value,
    'clash-sf2': value,
    'clash-playin': value,
    'clash-final': value,
  };
}

describe('whole Breakout show', () => {
  it('routes representative edge counts through the correct opening act', () => {
    for (const count of [
      1, 2, 3, 4, 5, 7, 9, 15, 16, 17, 20, 21, 23, 31, 33, 40, 41, 48, 60, 61, 100, 101,
    ]) {
      const result = simulateBreakout(entries(count), seeds(count), 'LOCK');
      expect(result.events.at(-1)?.type).toBe('winner.declared');
      expect(result.bracket.route).toBe(
        count === 1 ? 'one' : count === 2 ? 'two' : count === 3 ? 'three' : 'four',
      );
      expect(result.events.some((event) => event.type === 'faultline.wave-resolved')).toBe(
        count > 16,
      );
      expect(result.events.some((event) => event.type === 'race.beat-resolved')).toBe(count > 4);
    }
  });

  it('finishes every starting count 1–200 across fixed seeds with one winner', () => {
    for (let count = 1; count <= 200; count += 1) {
      for (let sample = 0; sample < 25; sample += 1) {
        const result = simulateBreakout(entries(count), seeds(sample + count * 100), 'LOCK');
        const terminal = result.events.at(-1)!;
        expect(terminal.type).toBe('winner.declared');
        expect(result.events.length).toBeLessThanOrEqual(500);
        expect(
          Object.values(terminal.after.statusById).filter((status) => status === 'winner'),
        ).toHaveLength(1);
        expect(
          Object.values(terminal.after.statusById).filter((status) => status === 'eliminated'),
        ).toHaveLength(count - 1);
      }
    }
  }, 30_000);

  it('covers large and boundary rosters across 100 fixed seeds', () => {
    for (const count of [201, 255, 256, 257, 999, 1000]) {
      for (let sample = 0; sample < 100; sample += 1) {
        const result = simulateBreakout(entries(count), seeds(sample + count), 'LOCK');
        expect(result.events.at(-1)?.type).toBe('winner.declared');
        expect(result.events.length).toBeLessThanOrEqual(500);
      }
    }
  }, 30_000);
});
