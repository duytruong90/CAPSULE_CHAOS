import type { DrawRule, GamePhase, ProtectionKind } from '../state/gameTypes';
import type { EngineEventPayloadByType } from '../state/gameTypes';

export const TIMELINE_SCHEMA_VERSION = 'capsule-chaos-timeline-v2' as const;

export interface TimelinePayloadByType {
  'capsule-spin': { sourceEngineEventId: string; drawRule: DrawRule; marked: boolean };
  'player-reveal': { sourceEngineEventId: string; drawRule: DrawRule; marked: boolean };
  elimination: { sourceEngineEventId: string; activeCount: number; eliminationCount: number };
  safe: { sourceEngineEventId: string; activeCount: number };
  'card-reveal': { sourceEngineEventId: string } & EngineEventPayloadByType['card-resolved'];
  protection: {
    sourceEngineEventId: string;
    protection: ProtectionKind;
    remainingCharges: number;
  };
  revival: { sourceEngineEventId: string; activeCount: number; revivalCount: number };
  duel: { sourceEngineEventId: string; winnerId: string; loserId: string };
  'phase-transition': {
    sourceEngineEventId: string;
    status: 'started' | 'complete';
    activeCount: number;
    targetCount: number;
  };
  'fake-winner': { sourceEngineEventId: string; apparentWinnerId: string };
  'final-fate': { sourceEngineEventId: string; outcome: string };
  winner: { sourceEngineEventId: string; winnerId: string };
}

export type TimelineEventType = keyof TimelinePayloadByType;

export type TimelineEventFor<Type extends TimelineEventType> = Readonly<{
  id: string;
  sequence: number;
  phase: GamePhase;
  type: Type;
  participants: readonly string[];
  payload: Readonly<TimelinePayloadByType[Type]>;
  presentationKey: string;
  minimumDurationMs: number;
}>;

export type TimelineEvent = {
  [Type in TimelineEventType]: TimelineEventFor<Type>;
}[TimelineEventType];

export interface GameTimeline {
  schemaVersion: typeof TIMELINE_SCHEMA_VERSION;
  engineRulesVersion: string;
  winnerId: string;
  playerIds: readonly string[];
  events: readonly TimelineEvent[];
}
