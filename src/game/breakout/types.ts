import type { AnimationSpeed } from '../state/setupTypes';

export const BREAKOUT_ENGINE_RULES_VERSION = 'capsule-chaos-engine-v4-breakout' as const;
export const BREAKOUT_LOCK_SCHEMA_VERSION = 'capsule-chaos-lock-v4' as const;
export const BREAKOUT_TIMELINE_SCHEMA_VERSION = 'capsule-chaos-timeline-v3-breakout' as const;
export const BREAKOUT_SESSION_SCHEMA_VERSION = 'capsule-chaos-session-v2-breakout' as const;
export const BREAKOUT_AUDIT_SCHEMA_VERSION = 'capsule-chaos-audit-v2-breakout' as const;

export type ActId = 'act-1' | 'act-2' | 'act-3';
export type BreakoutStatus = 'active' | 'qualified' | 'eliminated' | 'winner';
export type SectorId = 0 | 1 | 2 | 3;
export type RotationSteps = 0 | 1 | 3;

export interface BreakoutEntry {
  readonly id: string;
  readonly displayName: string;
  readonly normalizedName: string;
  readonly entryIndex: number;
}

export interface BreakoutHostConfig {
  readonly animationSpeed: AnimationSpeed;
  readonly soundEnabled: boolean;
  readonly autoAdvancePhases: boolean;
  readonly showFullSurvivorBoard: boolean;
  readonly allowDuplicateEntries: boolean;
  readonly reducedMotion: boolean;
}

export type FaultlineSectors = readonly [
  readonly string[],
  readonly string[],
  readonly string[],
  readonly string[],
];

export interface FaultlineWave {
  readonly waveIndex: number;
  readonly inputIds: readonly string[];
  readonly allocationOffset: SectorId;
  readonly sectorsBefore: FaultlineSectors;
  readonly collapsingSectorIds: readonly [SectorId, SectorId];
  readonly rotationSteps: RotationSteps;
  readonly sectorsAfterShift: FaultlineSectors;
  readonly eliminatedIds: readonly string[];
  readonly survivorIds: readonly string[];
}

export interface FaultlineResult {
  readonly survivorIds: readonly string[];
  readonly waves: readonly FaultlineWave[];
}

export interface FaultlineViewState {
  readonly kind: 'faultline';
  readonly waveIndex: number;
  readonly sectors: FaultlineSectors;
  readonly collapsingSectorIds: readonly SectorId[];
  readonly rotationSteps: RotationSteps;
  readonly eliminatedIds: readonly string[];
  readonly survivorIds: readonly string[];
  readonly complete: boolean;
}

export interface RaceMove {
  readonly playerId: string;
  readonly from: number;
  readonly movement: 1 | 2 | 3;
  readonly to: number;
  readonly crossing: null | { readonly remaining: number; readonly movement: number };
}

export interface Qualification {
  readonly playerId: string;
  readonly slot: 1 | 2 | 3 | 4;
  readonly beatIndex: number;
  readonly crossing: { readonly remaining: number; readonly movement: number };
}

export interface RaceBeat {
  readonly beatIndex: number;
  readonly moves: readonly RaceMove[];
  readonly crossingsInOrder: readonly string[];
  readonly newlyQualified: readonly Qualification[];
  readonly allQualified: readonly Qualification[];
  readonly cutoffTieIds: readonly string[];
  readonly cutoffTiePriorityIds: readonly string[];
  readonly tieSlotsAvailable: number;
  readonly eliminatedIds: readonly string[];
  readonly raceComplete: boolean;
}

export interface RaceViewState {
  readonly kind: 'race';
  readonly laneIds: readonly string[];
  readonly distanceById: Readonly<Record<string, number>>;
  readonly qualifications: readonly Qualification[];
  readonly beatIndex: number;
  readonly complete: boolean;
}

export interface EscapeRunResult {
  readonly qualifierIds: readonly string[];
  readonly movementDecksById: Readonly<Record<string, readonly (1 | 2 | 3)[]>>;
  readonly photoPriorityIds: readonly string[];
  readonly beats: readonly RaceBeat[];
}

export type ClashMove = 'pulse' | 'hack' | 'barrier';
export type MatchId = 'sf1' | 'sf2' | 'playin' | 'final';

export interface ClashExchange {
  readonly matchId: MatchId;
  readonly exchangeIndex: number;
  readonly playerIds: readonly [string, string];
  readonly moves: readonly [ClashMove, ClashMove];
  readonly scoreBefore: readonly [number, number];
  readonly scoreAfter: readonly [number, number];
  readonly pointWinnerId: string;
  readonly pointsToWin: 2 | 3;
  readonly matchWinnerId: string | null;
  readonly matchLoserId: string | null;
}

export interface ClashMatch {
  readonly matchId: MatchId;
  readonly playerIds: readonly [string, string];
  readonly pointsToWin: 2 | 3;
  readonly exchanges: readonly ClashExchange[];
  readonly winnerId: string;
  readonly loserId: string;
}

export interface ClashBracket {
  readonly route: 'four' | 'three' | 'two' | 'one';
  readonly seededSeatIds: readonly string[];
  readonly byePlayerId: string | null;
  readonly semifinalMatches: readonly ClashMatch[];
  readonly finalMatch: ClashMatch | null;
  readonly winnerId: string;
}

export interface ClashMatchupView {
  readonly matchId: MatchId;
  readonly playerIds: readonly [string, string];
  readonly pointsToWin: 2 | 3;
}

export interface ClashViewState {
  readonly kind: 'clash';
  readonly route: ClashBracket['route'];
  readonly seededSeatIds: readonly string[];
  readonly byePlayerId: string | null;
  readonly activeMatchIds: readonly MatchId[];
  readonly playerIdsByMatch: Readonly<Record<string, readonly [string, string]>>;
  readonly pointsToWinByMatch: Readonly<Record<string, 2 | 3>>;
  readonly scoreByMatch: Readonly<Record<string, readonly [number, number]>>;
  readonly completedMatchIds: readonly MatchId[];
  readonly complete: boolean;
}

export type BreakoutActState = FaultlineViewState | RaceViewState | ClashViewState;

export interface BreakoutSnapshot {
  readonly statusById: Readonly<Record<string, BreakoutStatus>>;
  readonly eligibleIds: readonly string[];
  readonly currentActState: BreakoutActState;
}

export interface BreakoutEventPayloadByType {
  'show.locked': { readonly rosterCount: number; readonly publicCommitment: string };
  'act.started': { readonly actId: ActId; readonly inputIds: readonly string[] };
  'act.skipped': {
    readonly reason: 'field-already-small';
    readonly inputIds: readonly string[];
    readonly destination: ActId;
  };
  'act.completed': { readonly actId: ActId; readonly outputIds: readonly string[] };
  'faultline.wave-resolved': { readonly wave: FaultlineWave };
  'race.beat-resolved': { readonly beat: RaceBeat };
  'clash.bracket-ready': {
    readonly route: ClashBracket['route'];
    readonly seededSeatIds: readonly string[];
    readonly byePlayerId: string | null;
    readonly matchups: readonly ClashMatchupView[];
  };
  'clash.exchange-resolved': { readonly exchanges: readonly ClashExchange[] };
  'clash.final-ready': { readonly finalistIds: readonly [string, string] };
  'winner.declared': {
    readonly winnerId: string;
    readonly reason: 'final-score' | 'sole-entry';
    readonly decisiveExchange: ClashExchange | null;
  };
}

export type BreakoutEngineEventType = keyof BreakoutEventPayloadByType;

export type BreakoutEngineEventFor<Type extends BreakoutEngineEventType> = Readonly<{
  id: string;
  sequence: number;
  act: ActId;
  type: Type;
  participants: readonly string[];
  payload: Readonly<BreakoutEventPayloadByType[Type]>;
  before: BreakoutSnapshot;
  after: BreakoutSnapshot;
}>;

export type BreakoutEngineEvent = {
  [Type in BreakoutEngineEventType]: BreakoutEngineEventFor<Type>;
}[BreakoutEngineEventType];

export type BreakoutRandomStreamLabel =
  | 'floor'
  | 'race-decks'
  | 'race-photo'
  | 'bracket'
  | 'clash-sf1'
  | 'clash-sf2'
  | 'clash-playin'
  | 'clash-final';

export type BreakoutRandomSeeds = Readonly<Record<BreakoutRandomStreamLabel, string>>;

export interface FaultlineActResult extends FaultlineResult {
  readonly entries: readonly BreakoutEntry[];
  readonly events: readonly BreakoutEngineEvent[];
}

export interface EscapeRunActResult extends EscapeRunResult {
  readonly entries: readonly BreakoutEntry[];
  readonly events: readonly BreakoutEngineEvent[];
}

export interface FinalClashActResult {
  readonly entries: readonly BreakoutEntry[];
  readonly bracket: ClashBracket;
  readonly events: readonly BreakoutEngineEvent[];
}

export interface BreakoutSimulationResult {
  readonly entries: readonly BreakoutEntry[];
  readonly faultline: FaultlineResult;
  readonly escapeRun: EscapeRunResult;
  readonly survivorIds: readonly string[];
  readonly qualifierIds: readonly string[];
  readonly bracket: ClashBracket;
  readonly winnerId: string;
  readonly events: readonly BreakoutEngineEvent[];
}
