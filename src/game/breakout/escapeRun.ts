import { SeededRng } from '../engine/rng';
import { BREAKOUT_RULES } from './config';
import type { EscapeRunResult, Qualification, RaceBeat, RaceMove } from './types';

export type RaceRng = Pick<SeededRng, 'shuffle'>;

interface RankedCrossing {
  readonly playerId: string;
  readonly remaining: number;
  readonly movement: number;
}

export function compareCrossingFractions(
  left: Pick<RankedCrossing, 'remaining' | 'movement'>,
  right: Pick<RankedCrossing, 'remaining' | 'movement'>,
) {
  return left.remaining * right.movement - right.remaining * left.movement;
}

function freezeQualification(qualification: Qualification): Qualification {
  return Object.freeze({
    ...qualification,
    crossing: Object.freeze({ ...qualification.crossing }),
  });
}

function assertUniqueIds(inputIds: readonly string[]) {
  if (new Set(inputIds).size !== inputIds.length) {
    throw new Error('Escape Run input contains duplicate entry IDs.');
  }
  if (inputIds.some((id) => id.length === 0)) {
    throw new Error('Escape Run input contains an empty entry ID.');
  }
}

export function simulateEscapeRunWithRng(
  inputIds: readonly string[],
  deckRng: RaceRng,
  photoRng: RaceRng,
): EscapeRunResult {
  assertUniqueIds(inputIds);
  const laneIds = Object.freeze([...inputIds]);

  if (laneIds.length === 0) throw new Error('invalid-race-field');
  if (laneIds.length > BREAKOUT_RULES.floorMaxSurvivors) {
    throw new Error('faultline-handoff-too-large');
  }
  if (laneIds.length <= BREAKOUT_RULES.raceSlots) {
    return Object.freeze({
      qualifierIds: laneIds,
      movementDecksById: Object.freeze({}),
      photoPriorityIds: Object.freeze([]),
      beats: Object.freeze([]),
    });
  }

  const movementDecksById: Record<string, readonly (1 | 2 | 3)[]> = {};
  laneIds.forEach((id) => {
    movementDecksById[id] = Object.freeze(deckRng.shuffle(BREAKOUT_RULES.raceMovementDeck));
  });
  const photoPriorityIds = Object.freeze(photoRng.shuffle(laneIds));
  const photoIndex = new Map(photoPriorityIds.map((id, index) => [id, index]));
  const distanceById: Record<string, number> = Object.fromEntries(laneIds.map((id) => [id, 0]));
  const qualifications: Qualification[] = [];
  const qualifiedIds = new Set<string>();
  const beats: RaceBeat[] = [];

  for (let beatIndex = 1; beatIndex <= 6 && qualifications.length < 4; beatIndex += 1) {
    const moves: RaceMove[] = laneIds
      .filter((id) => !qualifiedIds.has(id))
      .map((playerId) => {
        const deck = movementDecksById[playerId];
        const movement = deck?.[beatIndex - 1];
        if (movement === undefined) throw new Error('Race movement deck ended early.');
        const from = distanceById[playerId] as number;
        const to = from + movement;
        const crossing =
          from < BREAKOUT_RULES.raceFinishDistance && to >= BREAKOUT_RULES.raceFinishDistance
            ? Object.freeze({
                remaining: BREAKOUT_RULES.raceFinishDistance - from,
                movement,
              })
            : null;
        return Object.freeze({ playerId, from, movement, to, crossing });
      });

    const crossings = moves
      .filter(
        (move): move is RaceMove & { crossing: NonNullable<RaceMove['crossing']> } =>
          move.crossing !== null,
      )
      .map((move) => ({
        playerId: move.playerId,
        remaining: move.crossing.remaining,
        movement: move.crossing.movement,
      }))
      .sort((left, right) => {
        const fractionOrder = compareCrossingFractions(left, right);
        if (fractionOrder !== 0) return fractionOrder;
        return (
          (photoIndex.get(left.playerId) as number) - (photoIndex.get(right.playerId) as number)
        );
      });

    const available = BREAKOUT_RULES.raceSlots - qualifications.length;
    const awardedCrossings = crossings.slice(0, available);
    const cutoffLeft = crossings[available - 1];
    const cutoffRight = crossings[available];
    let cutoffTieIds: readonly string[] = Object.freeze([]);
    let cutoffTiePriorityIds: readonly string[] = Object.freeze([]);
    let tieSlotsAvailable = 0;

    if (
      cutoffLeft !== undefined &&
      cutoffRight !== undefined &&
      compareCrossingFractions(cutoffLeft, cutoffRight) === 0
    ) {
      const tiedCrossings = crossings.filter(
        (crossing) => compareCrossingFractions(crossing, cutoffLeft) === 0,
      );
      const tiedIdSet = new Set(tiedCrossings.map((crossing) => crossing.playerId));
      const strictlyEarlierCount = crossings.findIndex((crossing) =>
        tiedIdSet.has(crossing.playerId),
      );
      cutoffTieIds = Object.freeze(laneIds.filter((id) => tiedIdSet.has(id)));
      cutoffTiePriorityIds = Object.freeze(tiedCrossings.map((crossing) => crossing.playerId));
      tieSlotsAvailable = available - strictlyEarlierCount;
    }

    const newlyQualified = awardedCrossings.map((crossing, index) =>
      freezeQualification({
        playerId: crossing.playerId,
        slot: (qualifications.length + index + 1) as 1 | 2 | 3 | 4,
        beatIndex,
        crossing: Object.freeze({
          remaining: crossing.remaining,
          movement: crossing.movement,
        }),
      }),
    );

    moves.forEach((move) => {
      distanceById[move.playerId] = move.to;
    });
    newlyQualified.forEach((qualification) => {
      qualifications.push(qualification);
      qualifiedIds.add(qualification.playerId);
    });
    const raceComplete = qualifications.length === BREAKOUT_RULES.raceSlots;
    const eliminatedIds = raceComplete
      ? Object.freeze(laneIds.filter((id) => !qualifiedIds.has(id)))
      : Object.freeze([]);
    const beat = Object.freeze({
      beatIndex,
      moves: Object.freeze(moves),
      crossingsInOrder: Object.freeze(crossings.map((crossing) => crossing.playerId)),
      newlyQualified: Object.freeze(newlyQualified),
      allQualified: Object.freeze([...qualifications]),
      cutoffTieIds,
      cutoffTiePriorityIds,
      tieSlotsAvailable,
      eliminatedIds,
      raceComplete,
    });
    beats.push(beat);
  }

  if (qualifications.length !== BREAKOUT_RULES.raceSlots) {
    throw new Error('Escape Run failed to fill all four qualification slots by beat six.');
  }

  return Object.freeze({
    qualifierIds: Object.freeze(qualifications.map((qualification) => qualification.playerId)),
    movementDecksById: Object.freeze({ ...movementDecksById }),
    photoPriorityIds,
    beats: Object.freeze(beats),
  });
}

export function simulateEscapeRun(
  inputIds: readonly string[],
  deckSeed: string,
  photoSeed: string,
): EscapeRunResult {
  if (inputIds.length === 0) throw new Error('invalid-race-field');
  if (inputIds.length > BREAKOUT_RULES.floorMaxSurvivors) {
    throw new Error('faultline-handoff-too-large');
  }
  if (inputIds.length <= BREAKOUT_RULES.raceSlots) {
    assertUniqueIds(inputIds);
    return Object.freeze({
      qualifierIds: Object.freeze([...inputIds]),
      movementDecksById: Object.freeze({}),
      photoPriorityIds: Object.freeze([]),
      beats: Object.freeze([]),
    });
  }
  return simulateEscapeRunWithRng(inputIds, new SeededRng(deckSeed), new SeededRng(photoSeed));
}
