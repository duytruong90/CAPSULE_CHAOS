import { SeededRng } from '../engine/rng';
import { BREAKOUT_RULES, FAULTLINE_SECTOR_IDS } from './config';
import type {
  FaultlineResult,
  FaultlineSectors,
  FaultlineWave,
  RotationSteps,
  SectorId,
} from './types';

export type FaultlineRng = Pick<SeededRng, 'shuffle' | 'nextInt' | 'choose'>;

function freezeSectors(sectors: readonly (readonly string[])[]): FaultlineSectors {
  if (sectors.length !== BREAKOUT_RULES.floorSectorCount) {
    throw new Error('Faultline requires exactly four sectors.');
  }

  return Object.freeze(
    sectors.map((sector) => Object.freeze([...sector])),
  ) as unknown as FaultlineSectors;
}

function createEmptySectors(): [string[], string[], string[], string[]] {
  return [[], [], [], []];
}

function assertUniqueIds(inputIds: readonly string[]) {
  if (new Set(inputIds).size !== inputIds.length) {
    throw new Error('Faultline input contains duplicate entry IDs.');
  }
  if (inputIds.some((id) => id.length === 0)) {
    throw new Error('Faultline input contains an empty entry ID.');
  }
}

export function simulateFaultlineWithRng(
  inputIds: readonly string[],
  rng: FaultlineRng,
): FaultlineResult {
  assertUniqueIds(inputIds);
  const canonicalIds = Object.freeze([...inputIds]);

  if (canonicalIds.length <= BREAKOUT_RULES.floorMaxSurvivors) {
    return Object.freeze({ survivorIds: canonicalIds, waves: Object.freeze([]) });
  }

  const canonicalIndex = new Map(canonicalIds.map((id, index) => [id, index]));
  const waves: FaultlineWave[] = [];
  let activeIds = [...canonicalIds];
  let waveIndex = 1;

  while (activeIds.length > BREAKOUT_RULES.floorMaxSurvivors) {
    const shuffledIds = rng.shuffle(activeIds);
    const allocationOffset = rng.nextInt(0, BREAKOUT_RULES.floorSectorCount) as SectorId;
    const sectorsBeforeMutable = createEmptySectors();

    shuffledIds.forEach((id, index) => {
      const sectorId = ((index + allocationOffset) % BREAKOUT_RULES.floorSectorCount) as SectorId;
      sectorsBeforeMutable[sectorId].push(id);
    });

    const collapsingDraw = rng.shuffle(FAULTLINE_SECTOR_IDS).slice(
      0,
      BREAKOUT_RULES.floorCollapsingSectors,
    );
    const firstCollapsingSector = collapsingDraw[0];
    const secondCollapsingSector = collapsingDraw[1];
    if (firstCollapsingSector === undefined || secondCollapsingSector === undefined) {
      throw new Error('Faultline must select two collapsing sectors.');
    }
    const collapsingSectorIds: readonly [SectorId, SectorId] = Object.freeze([
      firstCollapsingSector,
      secondCollapsingSector,
    ]);
    const rotationSteps: RotationSteps =
      waveIndex === BREAKOUT_RULES.conveyorWave ? rng.choose([1, 3] as const) : 0;
    const sectorsAfterShiftMutable = createEmptySectors();

    FAULTLINE_SECTOR_IDS.forEach((sourceSectorId) => {
      const destinationSectorId = ((sourceSectorId + rotationSteps) % 4) as SectorId;
      sectorsAfterShiftMutable[destinationSectorId] = [...sectorsBeforeMutable[sourceSectorId]];
    });

    const eliminatedSet = new Set(
      collapsingSectorIds.flatMap((sectorId) => sectorsAfterShiftMutable[sectorId]),
    );
    const sortCanonical = (left: string, right: string) =>
      (canonicalIndex.get(left) as number) - (canonicalIndex.get(right) as number);
    const eliminatedIds = Object.freeze([...eliminatedSet].sort(sortCanonical));
    const survivorIds = Object.freeze(
      activeIds.filter((id) => !eliminatedSet.has(id)).sort(sortCanonical),
    );

    if (survivorIds.length === 0 || survivorIds.length >= activeIds.length) {
      throw new Error('Faultline wave must leave a smaller, non-empty survivor field.');
    }

    const wave = Object.freeze({
      waveIndex,
      inputIds: Object.freeze([...activeIds]),
      allocationOffset,
      sectorsBefore: freezeSectors(sectorsBeforeMutable),
      collapsingSectorIds,
      rotationSteps,
      sectorsAfterShift: freezeSectors(sectorsAfterShiftMutable),
      eliminatedIds,
      survivorIds,
    });
    waves.push(wave);
    activeIds = [...survivorIds];
    waveIndex += 1;
  }

  return Object.freeze({
    survivorIds: Object.freeze([...activeIds]),
    waves: Object.freeze(waves),
  });
}

export function simulateFaultline(inputIds: readonly string[], floorSeed: string): FaultlineResult {
  if (inputIds.length <= BREAKOUT_RULES.floorMaxSurvivors) {
    assertUniqueIds(inputIds);
    return Object.freeze({
      survivorIds: Object.freeze([...inputIds]),
      waves: Object.freeze([]),
    });
  }
  return simulateFaultlineWithRng(inputIds, new SeededRng(floorSeed));
}
