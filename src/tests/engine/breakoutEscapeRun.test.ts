import {
  compareCrossingFractions,
  simulateEscapeRun,
  simulateEscapeRunWithRng,
  type RaceRng,
} from '../../game/breakout/escapeRun';
import { simulateEscapeRunAct } from '../../game/breakout/simulateBreakout';
import type { BreakoutEntry } from '../../game/breakout/types';

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

describe('Escape Run crossing rules', () => {
  it.each([
    [{ remaining: 1, movement: 1 }, { remaining: 2, movement: 3 }, 1],
    [{ remaining: 1, movement: 2 }, { remaining: 2, movement: 3 }, -1],
    [{ remaining: 1, movement: 1 }, { remaining: 2, movement: 2 }, 0],
    [{ remaining: 2, movement: 2 }, { remaining: 3, movement: 3 }, 0],
  ] as const)('compares $0 against $1 without floating point', (left, right, sign) => {
    expect(Math.sign(compareCrossingFractions(left, right))).toBe(sign);
  });

  it('uses locked photo priority for a five-way cutoff tie', () => {
    const source = ids(5);
    const deckRng: RaceRng = {
      shuffle: <T>() => [3, 3, 2, 2, 1, 1] as unknown as T[],
    };
    const photoOrder = [...source].reverse();
    const photoRng: RaceRng = {
      shuffle: <T>() => photoOrder as unknown as T[],
    };
    const result = simulateEscapeRunWithRng(source, deckRng, photoRng);
    const closingBeat = result.beats.at(-1);

    expect(closingBeat?.cutoffTieIds).toEqual(source);
    expect(closingBeat?.cutoffTiePriorityIds).toEqual(photoOrder);
    expect(closingBeat?.tieSlotsAvailable).toBe(4);
    expect(result.qualifierIds).toEqual(photoOrder.slice(0, 4));
    expect(closingBeat?.eliminatedIds).toEqual([source[0]]);
  });
});

describe('simulateEscapeRun', () => {
  it.each([1, 2, 3, 4])('skips a %s-entry field without consuming either RNG', (count) => {
    const rejecting: RaceRng = {
      shuffle: () => {
        throw new Error('RNG must not be consumed');
      },
    };
    const source = ids(count);
    const result = simulateEscapeRunWithRng(source, rejecting, rejecting);
    expect(result.qualifierIds).toEqual(source);
    expect(result.beats).toEqual([]);
    expect(result.photoPriorityIds).toEqual([]);
    expect(result.movementDecksById).toEqual({});
  });

  it('rejects invalid race handoffs', () => {
    expect(() => simulateEscapeRun([], '0'.repeat(64), '1'.repeat(64))).toThrow(
      'invalid-race-field',
    );
    expect(() => simulateEscapeRun(ids(17), '0'.repeat(64), '1'.repeat(64))).toThrow(
      'faultline-handoff-too-large',
    );
  });

  it('produces exactly four qualifiers for every field size across 1,000 seeds', () => {
    for (let count = 5; count <= 16; count += 1) {
      for (let sample = 0; sample < 1_000; sample += 1) {
        const deckSeed = BigInt(count * 10_000 + sample + 1)
          .toString(16)
          .padStart(64, '0');
        const photoSeed = BigInt(count * 20_000 + sample + 7)
          .toString(16)
          .padStart(64, '0');
        const result = simulateEscapeRun(ids(count), deckSeed, photoSeed);
        expect(result.qualifierIds).toHaveLength(4);
        expect(new Set(result.qualifierIds)).toHaveLength(4);
        expect(result.beats.length).toBeLessThanOrEqual(6);
        Object.values(result.movementDecksById).forEach((deck) => {
          expect([...deck].sort()).toEqual([1, 1, 2, 2, 3, 3]);
        });
        const closingBeat = result.beats.at(-1);
        expect(closingBeat?.raceComplete).toBe(true);
        expect(closingBeat?.eliminatedIds).toHaveLength(count - 4);
        expect(new Set(closingBeat?.eliminatedIds)).toHaveLength(count - 4);
        result.beats.slice(0, -1).forEach((beat) => expect(beat.eliminatedIds).toEqual([]));

        const previousDistance: Record<string, number> = Object.fromEntries(
          ids(count).map((id) => [id, 0]),
        );
        const parked = new Set<string>();
        result.beats.forEach((beat) => {
          beat.moves.forEach((move) => {
            expect(parked.has(move.playerId)).toBe(false);
            expect(move.from).toBe(previousDistance[move.playerId]);
            expect(move.to).toBe(move.from + move.movement);
            previousDistance[move.playerId] = move.to;
          });
          beat.newlyQualified.forEach((qualification) => parked.add(qualification.playerId));
        });
      }
    }
  }, 20_000);

  it('reproduces the complete race record for the same seeds', () => {
    const first = simulateEscapeRun(ids(16), '12'.repeat(32), '34'.repeat(32));
    const second = simulateEscapeRun(ids(16), '12'.repeat(32), '34'.repeat(32));
    expect(first).toEqual(second);
    expect(Object.isFrozen(first.beats)).toBe(true);
    expect(Object.isFrozen(first.movementDecksById[first.qualifierIds[0] as string])).toBe(true);
  });

  it('emits grouped snapshots and eliminates all nonqualifiers atomically', () => {
    const result = simulateEscapeRunAct(
      entries(12),
      ids(12).reverse(),
      '56'.repeat(32),
      '78'.repeat(32),
      20,
    );
    expect(result.events[0]?.sequence).toBe(20);
    const raceEvents = result.events.filter((event) => event.type === 'race.beat-resolved');
    const closing = raceEvents.at(-1);
    expect(closing?.type).toBe('race.beat-resolved');
    if (closing?.type !== 'race.beat-resolved') return;
    expect(closing.payload.beat.eliminatedIds.length).toBe(8);
    closing.payload.beat.eliminatedIds.forEach((id) => {
      expect(closing.before.statusById[id]).toBe('active');
      expect(closing.after.statusById[id]).toBe('eliminated');
    });
    expect(new Set(closing.after.eligibleIds)).toEqual(new Set(result.qualifierIds));
    expect(result.events.at(-1)?.type).toBe('act.completed');
  });

  it('emits only an Act 2 skip for fields of four or fewer', () => {
    const result = simulateEscapeRunAct(entries(4), ids(4), '9a'.repeat(32), 'bc'.repeat(32));
    expect(result.events.map((event) => event.type)).toEqual(['act.skipped']);
  });
});
