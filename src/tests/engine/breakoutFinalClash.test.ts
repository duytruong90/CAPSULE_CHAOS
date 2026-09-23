import { describe, expect, it } from 'vitest';
import {
  CLASH_MOVES,
  resolveClashMoves,
  simulateClashMatchWithRng,
  simulateFinalClash,
  type ClashRng,
  type FinalClashSeeds,
} from '../../game/breakout/finalClash';
import { simulateFinalClashAct } from '../../game/breakout/simulateBreakout';
import type { BreakoutEntry, ClashMove } from '../../game/breakout/types';

const seed = (digit: string) => digit.repeat(64);
const seeds = (suffix = ''): FinalClashSeeds => ({
  bracket: seed(suffix || '1'),
  'clash-sf1': seed('2'),
  'clash-sf2': seed('3'),
  'clash-playin': seed('4'),
  'clash-final': seed('5'),
});

function entries(count: number): BreakoutEntry[] {
  return Array.from({ length: count }, (_, entryIndex) => ({
    id: `entry-${entryIndex + 1}`,
    displayName: `Player ${entryIndex + 1}`,
    normalizedName: `Player ${entryIndex + 1}`,
    entryIndex,
  }));
}

function scriptedRng(deals: readonly (readonly ClashMove[])[]): ClashRng {
  let index = 0;
  return {
    shuffle<T>() {
      const deal = deals[index++];
      if (!deal) throw new Error('fixture exhausted');
      return [...deal] as T[];
    },
  };
}

describe('Final Clash engine', () => {
  it('resolves all six distinct ordered deals with three wins per seat', () => {
    const pairs = CLASH_MOVES.flatMap((left) =>
      CLASH_MOVES.filter((right) => right !== left).map((right) => [left, right] as const),
    );
    const results = pairs.map(([left, right]) => resolveClashMoves(left, right));
    expect(results.filter((result) => result.winningSeat === 0)).toHaveLength(3);
    expect(results.filter((result) => result.winningSeat === 1)).toHaveLength(3);
    expect(results.every((result) => result.relationship.length > 10)).toBe(true);
    expect(() => resolveClashMoves('pulse', 'pulse')).toThrow('distinct');
  });

  it('stops a match at its target without generating an extra deal', () => {
    const match = simulateClashMatchWithRng(
      'final',
      ['left', 'right'],
      3,
      scriptedRng([
        ['pulse', 'hack', 'barrier'],
        ['pulse', 'hack', 'barrier'],
        ['pulse', 'hack', 'barrier'],
      ]),
    );
    expect(match.exchanges).toHaveLength(3);
    expect(match.exchanges.at(-1)?.scoreAfter).toEqual([3, 0]);
    expect(match.winnerId).toBe('left');
  });

  it.each([
    [1, 'one', 0],
    [2, 'two', 0],
    [3, 'three', 1],
    [4, 'four', 2],
  ] as const)('builds the exact %i-player route', (count, route, semifinalCount) => {
    const ids = entries(count).map((entry) => entry.id);
    const result = simulateFinalClash(ids, seeds());
    expect(result.route).toBe(route);
    expect(result.semifinalMatches).toHaveLength(semifinalCount);
    expect(result.finalMatch === null).toBe(count === 1);
    expect(ids).toContain(result.winnerId);
    if (count === 3) expect(result.byePlayerId).toBe(result.seededSeatIds[0]);
  });

  it('does not construct RNG for the sole-entry route', () => {
    expect(
      simulateFinalClash(['only'], {
        bracket: 'not-a-seed',
        'clash-sf1': 'not-a-seed',
        'clash-sf2': 'not-a-seed',
        'clash-playin': 'not-a-seed',
        'clash-final': 'not-a-seed',
      }),
    ).toMatchObject({ route: 'one', winnerId: 'only', finalMatch: null });
  });

  it('rejects invalid fields before playback', () => {
    expect(() => simulateFinalClash([], seeds())).toThrow('invalid-clash-field');
    expect(() => simulateFinalClash(['a', 'b', 'c', 'd', 'e'], seeds())).toThrow(
      'invalid-clash-field',
    );
    expect(() => simulateFinalClash(['a', 'a'], seeds())).toThrow('unique');
  });

  it('keeps match lengths and score totals within their hard bounds', () => {
    for (let sample = 0; sample < 250; sample += 1) {
      const hex = sample.toString(16).padStart(64, '0');
      const result = simulateFinalClash(['a', 'b', 'c', 'd'], {
        bracket: hex,
        'clash-sf1': seed('2'),
        'clash-sf2': hex,
        'clash-playin': seed('4'),
        'clash-final': hex,
      });
      result.semifinalMatches.forEach((match) => {
        expect(match.exchanges.length).toBeGreaterThanOrEqual(2);
        expect(match.exchanges.length).toBeLessThanOrEqual(3);
      });
      expect(result.finalMatch?.exchanges.length).toBeGreaterThanOrEqual(3);
      expect(result.finalMatch?.exchanges.length).toBeLessThanOrEqual(5);
      result.finalMatch?.exchanges.forEach((exchange) => {
        expect(exchange.scoreAfter[0] + exchange.scoreAfter[1]).toBe(exchange.exchangeIndex);
      });
    }
  });

  it('emits parallel semifinal beats without replaying a completed match', () => {
    const roster = entries(4);
    let result = simulateFinalClashAct(
      roster,
      roster.map((entry) => entry.id),
      seeds(),
    );
    for (let sample = 1; sample < 200; sample += 1) {
      const nextSeeds = { ...seeds(), 'clash-sf2': sample.toString(16).padStart(64, '0') };
      result = simulateFinalClashAct(
        roster,
        roster.map((entry) => entry.id),
        nextSeeds,
      );
      const lengths = result.bracket.semifinalMatches.map((match) => match.exchanges.length);
      if (lengths.includes(2) && lengths.includes(3)) break;
    }
    const semifinalEvents = result.events.flatMap((event) =>
      event.type === 'clash.exchange-resolved' && event.payload.exchanges[0]?.matchId !== 'final'
        ? [event]
        : [],
    );
    expect(semifinalEvents).toHaveLength(3);
    expect(semifinalEvents[0]?.payload.exchanges).toHaveLength(2);
    expect(semifinalEvents[1]?.payload.exchanges).toHaveLength(2);
    expect(semifinalEvents[2]?.payload.exchanges).toHaveLength(1);
  });

  it('resets the final to zero and declares the winner exactly once', () => {
    const roster = entries(4);
    const result = simulateFinalClashAct(
      roster,
      roster.map((entry) => entry.id),
      seeds(),
    );
    const finalReady = result.events.find((event) => event.type === 'clash.final-ready');
    expect(finalReady?.after.currentActState).toMatchObject({
      kind: 'clash',
      scoreByMatch: { final: [0, 0] },
    });
    const winnerEvents = result.events.filter((event) => event.type === 'winner.declared');
    expect(winnerEvents).toHaveLength(1);
    const winnerEvent = winnerEvents[0];
    expect(winnerEvent?.payload.decisiveExchange?.matchWinnerId).toBe(
      winnerEvent?.payload.winnerId,
    );
    expect(
      result.events.some(
        (event) =>
          event.type === 'clash.exchange-resolved' &&
          event.payload.exchanges.some(
            (exchange) => exchange === winnerEvent?.payload.decisiveExchange,
          ),
      ),
    ).toBe(false);
    expect(
      Object.values(winnerEvent?.after.statusById ?? {}).filter((status) => status === 'winner'),
    ).toHaveLength(1);
    expect(
      Object.values(winnerEvent?.after.statusById ?? {}).filter(
        (status) => status === 'eliminated',
      ),
    ).toHaveLength(3);
  });

  it('uses the audit-only sole-entry start and null decisive exchange', () => {
    const roster = entries(1);
    const result = simulateFinalClashAct(roster, [roster[0]!.id], seeds());
    expect(result.events.map((event) => event.type)).toEqual(['act.started', 'winner.declared']);
    expect(result.events[1]?.payload).toMatchObject({
      reason: 'sole-entry',
      decisiveExchange: null,
    });
  });

  it('reproduces every bracket seat, exchange and winner', () => {
    const ids = ['a', 'b', 'c', 'd'];
    expect(simulateFinalClash(ids, seeds())).toEqual(simulateFinalClash(ids, seeds()));
  });
});
