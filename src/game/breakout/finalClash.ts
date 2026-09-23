import { SeededRng } from '../engine/rng';
import type { ClashBracket, ClashExchange, ClashMatch, ClashMove, MatchId } from './types';

export const CLASH_MOVES = Object.freeze(['pulse', 'hack', 'barrier'] as const);
export const CLASH_BEATS = Object.freeze({
  pulse: 'hack',
  hack: 'barrier',
  barrier: 'pulse',
} as const satisfies Record<ClashMove, ClashMove>);

export const CLASH_RELATIONSHIPS = Object.freeze({
  pulse: 'Pulse overloads Hack’s circuit.',
  hack: 'Hack opens the Barrier’s lock.',
  barrier: 'Barrier absorbs and reflects Pulse.',
} as const satisfies Record<ClashMove, string>);

export type ClashRng = Pick<SeededRng, 'shuffle'>;

export interface FinalClashSeeds {
  readonly bracket: string;
  readonly 'clash-sf1': string;
  readonly 'clash-sf2': string;
  readonly 'clash-playin': string;
  readonly 'clash-final': string;
}

function assertClashIds(inputIds: readonly string[]) {
  if (inputIds.length === 0 || inputIds.length > 4) throw new Error('invalid-clash-field');
  if (new Set(inputIds).size !== inputIds.length || inputIds.some((id) => id.length === 0)) {
    throw new Error('Final Clash input must contain unique, non-empty IDs.');
  }
}

function freezePair<T>(pair: readonly [T, T]): readonly [T, T] {
  return Object.freeze([pair[0], pair[1]]);
}

function freezeExchange(exchange: ClashExchange): ClashExchange {
  return Object.freeze({
    ...exchange,
    playerIds: freezePair(exchange.playerIds),
    moves: freezePair(exchange.moves),
    scoreBefore: freezePair(exchange.scoreBefore),
    scoreAfter: freezePair(exchange.scoreAfter),
  });
}

export function resolveClashMoves(
  leftMove: ClashMove,
  rightMove: ClashMove,
): { readonly winningSeat: 0 | 1; readonly relationship: string } {
  if (leftMove === rightMove) throw new Error('Clash moves must be distinct.');
  const winningSeat: 0 | 1 = CLASH_BEATS[leftMove] === rightMove ? 0 : 1;
  const winningMove = winningSeat === 0 ? leftMove : rightMove;
  return Object.freeze({
    winningSeat,
    relationship: CLASH_RELATIONSHIPS[winningMove],
  });
}

export function simulateClashMatchWithRng(
  matchId: MatchId,
  playerIds: readonly [string, string],
  pointsToWin: 2 | 3,
  rng: ClashRng,
): ClashMatch {
  if (playerIds[0] === playerIds[1] || playerIds.some((id) => id.length === 0)) {
    throw new Error('Clash match requires two distinct, non-empty player IDs.');
  }
  const score: [number, number] = [0, 0];
  const exchanges: ClashExchange[] = [];

  while (score[0] < pointsToWin && score[1] < pointsToWin) {
    const dealt = rng.shuffle(CLASH_MOVES);
    const leftMove = dealt[0];
    const rightMove = dealt[1];
    if (!leftMove || !rightMove) throw new Error('Clash deal did not produce two moves.');
    const { winningSeat } = resolveClashMoves(leftMove, rightMove);
    const scoreBefore = freezePair(score);
    score[winningSeat] += 1;
    const matchComplete = score[winningSeat] === pointsToWin;
    exchanges.push(
      freezeExchange({
        matchId,
        exchangeIndex: exchanges.length + 1,
        playerIds,
        moves: [leftMove, rightMove],
        scoreBefore,
        scoreAfter: [score[0], score[1]],
        pointWinnerId: playerIds[winningSeat],
        pointsToWin,
        matchWinnerId: matchComplete ? playerIds[winningSeat] : null,
        matchLoserId: matchComplete ? playerIds[winningSeat === 0 ? 1 : 0] : null,
      }),
    );
  }

  const finalExchange = exchanges.at(-1);
  if (!finalExchange?.matchWinnerId || !finalExchange.matchLoserId) {
    throw new Error('Clash match ended without a winner.');
  }
  return Object.freeze({
    matchId,
    playerIds: freezePair(playerIds),
    pointsToWin,
    exchanges: Object.freeze(exchanges),
    winnerId: finalExchange.matchWinnerId,
    loserId: finalExchange.matchLoserId,
  });
}

function simulateSeededMatch(
  matchId: MatchId,
  playerIds: readonly [string, string],
  pointsToWin: 2 | 3,
  seed: string,
) {
  return simulateClashMatchWithRng(matchId, playerIds, pointsToWin, new SeededRng(seed));
}

export function simulateFinalClash(
  inputIds: readonly string[],
  seeds: FinalClashSeeds,
): ClashBracket {
  assertClashIds(inputIds);
  if (inputIds.length === 1) {
    return Object.freeze({
      route: 'one',
      seededSeatIds: Object.freeze([...inputIds]),
      byePlayerId: null,
      semifinalMatches: Object.freeze([]),
      finalMatch: null,
      winnerId: inputIds[0] as string,
    });
  }

  const seededSeatIds = Object.freeze(new SeededRng(seeds.bracket).shuffle(inputIds));
  let byePlayerId: string | null = null;
  let semifinalMatches: readonly ClashMatch[];
  let finalists: readonly [string, string];

  if (seededSeatIds.length === 4) {
    const sf1 = simulateSeededMatch(
      'sf1',
      [seededSeatIds[0] as string, seededSeatIds[1] as string],
      2,
      seeds['clash-sf1'],
    );
    const sf2 = simulateSeededMatch(
      'sf2',
      [seededSeatIds[2] as string, seededSeatIds[3] as string],
      2,
      seeds['clash-sf2'],
    );
    semifinalMatches = Object.freeze([sf1, sf2]);
    finalists = Object.freeze([sf1.winnerId, sf2.winnerId]);
  } else if (seededSeatIds.length === 3) {
    byePlayerId = seededSeatIds[0] as string;
    const playin = simulateSeededMatch(
      'playin',
      [seededSeatIds[1] as string, seededSeatIds[2] as string],
      2,
      seeds['clash-playin'],
    );
    semifinalMatches = Object.freeze([playin]);
    finalists = Object.freeze([byePlayerId, playin.winnerId]);
  } else {
    semifinalMatches = Object.freeze([]);
    finalists = Object.freeze([seededSeatIds[0] as string, seededSeatIds[1] as string]);
  }

  const finalMatch = simulateSeededMatch('final', finalists, 3, seeds['clash-final']);
  return Object.freeze({
    route: seededSeatIds.length === 4 ? 'four' : seededSeatIds.length === 3 ? 'three' : 'two',
    seededSeatIds,
    byePlayerId,
    semifinalMatches,
    finalMatch,
    winnerId: finalMatch.winnerId,
  });
}
