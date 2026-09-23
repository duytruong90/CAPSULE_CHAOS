export const BREAKOUT_RULES = Object.freeze({
  floorMaxSurvivors: 16,
  floorSectorCount: 4,
  floorCollapsingSectors: 2,
  conveyorWave: 2,
  raceSlots: 4,
  raceFinishDistance: 9,
  raceMovementDeck: Object.freeze([1, 1, 2, 2, 3, 3] as const),
  semifinalPointsToWin: 2,
  finalPointsToWin: 3,
  maxEngineEvents: 500,
} as const);

export const FAULTLINE_SECTOR_IDS = Object.freeze([0, 1, 2, 3] as const);
export const FAULTLINE_SECTOR_LABELS = Object.freeze(['A', 'B', 'C', 'D'] as const);
export const FAULTLINE_NAMES_PER_PAGE = 12;
export const FAULTLINE_PAGE_DURATION_MS = 3_000;
