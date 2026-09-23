import { BREAKOUT_RULES } from '../../game/breakout/config';
import { simulateFaultline, simulateFaultlineWithRng, type FaultlineRng } from '../../game/breakout/faultline';
import { simulateFaultlineAct } from '../../game/breakout/simulateBreakout';
import type { BreakoutEntry, FaultlineWave, SectorId } from '../../game/breakout/types';

const seed = '0123456789abcdef'.repeat(4);

function ids(count: number) {
  return Array.from({ length: count }, (_, index) => `entry-${String(index + 1).padStart(4, '0')}`);
}

function entries(count: number): BreakoutEntry[] {
  return ids(count).map((id, entryIndex) => ({
    id,
    displayName: `Player ${entryIndex + 1}`,
    normalizedName: `Player ${entryIndex + 1}`,
    entryIndex,
  }));
}

function verifyWave(wave: FaultlineWave) {
  expect(wave.sectorsBefore.flat()).toHaveLength(wave.inputIds.length);
  expect(new Set(wave.sectorsBefore.flat())).toEqual(new Set(wave.inputIds));
  expect(new Set(wave.collapsingSectorIds)).toHaveLength(2);
  expect(new Set([...wave.eliminatedIds, ...wave.survivorIds])).toEqual(new Set(wave.inputIds));
  expect(new Set(wave.eliminatedIds).size).toBe(wave.eliminatedIds.length);
  expect(new Set(wave.survivorIds).size).toBe(wave.survivorIds.length);
  expect(wave.eliminatedIds.filter((id) => wave.survivorIds.includes(id))).toEqual([]);
  const sizes = wave.sectorsBefore.map((sector) => sector.length);
  expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
}

describe('simulateFaultline', () => {
  it.each([1, 2, 4, 5, 8, 16])('skips %s entries without consuming floor randomness', (count) => {
    const source = ids(count);
    const rejectingRng: FaultlineRng = {
      shuffle: () => { throw new Error('RNG must not be consumed'); },
      nextInt: () => { throw new Error('RNG must not be consumed'); },
      choose: () => { throw new Error('RNG must not be consumed'); },
    };
    const result = simulateFaultlineWithRng(source, rejectingRng);

    expect(result.survivorIds).toEqual(source);
    expect(result.waves).toEqual([]);
    expect(result.survivorIds).not.toBe(source);
  });

  it('rejects duplicate IDs before any wave', () => {
    expect(() => simulateFaultline(['same', 'same'], seed)).toThrow('duplicate');
  });

  it('is deterministic and does not mutate its input', () => {
    const source = ids(61);
    const original = [...source];
    const first = simulateFaultline(source, seed);
    const second = simulateFaultline(source, seed);

    expect(first).toEqual(second);
    expect(source).toEqual(original);
    expect(Object.isFrozen(first.waves)).toBe(true);
    expect(Object.isFrozen(first.waves[0]?.sectorsBefore[0])).toBe(true);
  });

  it('preserves the exact wave invariants over the required normal range', () => {
    const edgeCounts = [201, 255, 256, 257, 999, 1_000];
    for (const count of [...Array.from({ length: 184 }, (_, index) => index + 17), ...edgeCounts]) {
      const rounds = edgeCounts.includes(count) ? 100 : 25;
      for (let round = 0; round < rounds; round += 1) {
        const roundSeed = (BigInt(count * 1_000 + round) + 1n).toString(16).padStart(64, '0');
        const result = simulateFaultline(ids(count), roundSeed);
        expect(result.survivorIds.length).toBeGreaterThanOrEqual(8);
        expect(result.survivorIds.length).toBeLessThanOrEqual(16);
        result.waves.forEach((wave, index) => {
          verifyWave(wave);
          expect(wave.survivorIds.length).toBeLessThan(wave.inputIds.length);
          if (index === 1) expect([1, 3]).toContain(wave.rotationSteps);
          else expect(wave.rotationSteps).toBe(0);
        });
      }
    }
  });

  it.each([1, 3] as const)('moves wave-two occupants %s quarter-turn steps', (direction) => {
    let shuffleCall = 0;
    const rng: FaultlineRng = {
      nextInt: () => 0,
      choose: <T,>() => direction as unknown as T,
      shuffle: <T,>(values: readonly T[]): T[] => {
        shuffleCall += 1;
        if (shuffleCall === 2) {
          return [values[1] as T, values[2] as T, values[0] as T, values[3] as T];
        }
        if (shuffleCall === 4) {
          return [values[0] as T, values[2] as T, values[1] as T, values[3] as T];
        }
        return [...values];
      },
    };
    const result = simulateFaultlineWithRng(ids(33), rng);
    const wave = result.waves[1];
    expect(wave).toBeDefined();
    expect(wave?.rotationSteps).toBe(direction);
    ([0, 1, 2, 3] as SectorId[]).forEach((sourceSector) => {
      const destination = ((sourceSector + direction) % 4) as SectorId;
      expect(wave?.sectorsAfterShift[destination]).toEqual(wave?.sectorsBefore[sourceSector]);
    });
  });

  it('builds contiguous grouped events and commits each wave atomically', () => {
    const result = simulateFaultlineAct(entries(33), seed, 'ABCD-EF01-2345-6789');
    expect(result.events.map((event) => event.sequence)).toEqual(
      result.events.map((_, index) => index),
    );
    expect(result.events.map((event) => event.id)).toEqual(
      result.events.map((_, index) => `breakout-event-${String(index + 1).padStart(4, '0')}`),
    );
    const waveEvents = result.events.filter((event) => event.type === 'faultline.wave-resolved');
    expect(waveEvents).toHaveLength(result.waves.length);
    waveEvents.forEach((event) => {
      if (event.type !== 'faultline.wave-resolved') return;
      event.payload.wave.eliminatedIds.forEach((id) => {
        expect(event.before.statusById[id]).toBe('active');
        expect(event.after.statusById[id]).toBe('eliminated');
      });
      expect(event.after.eligibleIds).toEqual(event.payload.wave.survivorIds);
    });
    expect(result.events.at(-1)?.type).toBe('act.completed');
  });

  it('emits only the lock and skipped act for a compact field', () => {
    const result = simulateFaultlineAct(entries(BREAKOUT_RULES.floorMaxSurvivors), seed, 'LOCK');
    expect(result.events.map((event) => event.type)).toEqual(['show.locked', 'act.skipped']);
  });
});
