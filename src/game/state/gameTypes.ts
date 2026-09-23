import type { GameConfig } from './gameConfig';
import type { PlayerEntry } from './setupTypes';
import type { CardRarity } from '../cards/cardTypes';

export const ENGINE_RULES_VERSION = 'capsule-chaos-engine-v3-full-show' as const;

export type PlayerState = 'active' | 'safe' | 'eliminated' | 'revived' | 'finalist' | 'winner';

export type GamePhase = 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4' | 'phase-5' | 'final';

export type PhaseStatus = 'pending' | 'running' | 'complete';

export type PlayerHistoryEventType =
  | 'drawn'
  | 'eliminated'
  | 'safe'
  | 'shield-consumed'
  | 'second-life-consumed'
  | 'revived'
  | 'protected'
  | 'phase-locked'
  | 'finalist'
  | 'winner';

export interface PlayerHistoryEvent {
  eventId: string;
  sequence: number;
  phase: GamePhase;
  type: PlayerHistoryEventType;
}

export interface Player extends PlayerEntry {
  state: PlayerState;
  shieldCharges: number;
  secondLifeCharges: number;
  lockedUntilPhase?: GamePhase;
  eliminationCount: number;
  revivalCount: number;
  history: readonly PlayerHistoryEvent[];
}

export interface PhaseTargets {
  'phase-1': number;
  'phase-2': number;
  'phase-3': number;
  'phase-4': number;
  'phase-5': number;
  final: number;
}

export type DrawRule = 'eliminate' | 'safe';
export type ProtectionKind = 'shield' | 'second-life';
export type FinalFateOutcome =
  'normal' | 'reverse' | 'duel' | 'system-override' | 'revival-challenge' | 'fate-swap';
export type FakeoutType =
  'none' | 'false-celebration' | 'recalculation' | 'capsule-refusal' | 'double-reveal';

export interface PlayerStatusSnapshot {
  id: string;
  state: PlayerState;
  shieldCharges: number;
  secondLifeCharges: number;
  lockedUntilPhase?: GamePhase;
  revivalCount: number;
}

export interface EngineEventPayloadByType {
  'phase-started': { activeCount: number; targetCount: number };
  'player-drawn': {
    drawRule: DrawRule;
    activeCount: number;
    marked: boolean;
    nearMiss: boolean;
    firstSafeDraw: boolean;
  };
  'card-resolved': {
    cardId: string;
    name: string;
    rarity: CardRarity;
    description: string;
    presentationKey: string;
    resultText: string;
  };
  'player-eliminated': { activeCount: number; eliminationCount: number };
  'player-safe': { activeCount: number };
  'protection-consumed': { protection: ProtectionKind; remainingCharges: number };
  'protection-granted': { protection: ProtectionKind; charges: number; sourcePlayerId?: string };
  'player-phase-locked': { untilPhase: GamePhase };
  'player-revived': { activeCount: number; revivalCount: number };
  'duel-resolved': { winnerId: string; loserId: string };
  'state-restored': { cardId: string; activeCount: number };
  'final-fate-resolved': {
    outcome: FinalFateOutcome;
    advancingPlayerIds: readonly string[];
    eliminatedPlayerIds: readonly string[];
  };
  'final-chamber-ready': {
    winnerId: string;
    loserId: string;
    fakeoutType: FakeoutType;
    apparentWinnerId: string;
  };
  'phase-completed': { activeCount: number; targetCount: number };
  'winner-declared': { activeCount: 1 };
}

export type EngineEventType = keyof EngineEventPayloadByType;

export type EngineEventFor<T extends EngineEventType> = Readonly<{
  id: string;
  sequence: number;
  phase: GamePhase;
  type: T;
  participants: readonly string[];
  payload: Readonly<EngineEventPayloadByType[T]>;
  snapshot: readonly PlayerStatusSnapshot[];
}>;

export type EngineEvent = {
  [Type in EngineEventType]: EngineEventFor<Type>;
}[EngineEventType];

export interface GameStateSnapshot {
  phase: GamePhase;
  status: PhaseStatus;
  players: readonly Player[];
  eventCount: number;
  config: Readonly<GameConfig>;
}

export interface SimulationInput {
  roster: readonly PlayerEntry[];
  config: GameConfig;
  seed: string;
}

export interface SimulationResult {
  rulesVersion: typeof ENGINE_RULES_VERSION;
  seed: string;
  config: Readonly<GameConfig>;
  phaseTargets: Readonly<PhaseTargets>;
  players: readonly Player[];
  events: readonly EngineEvent[];
  winnerId: string;
  completed: true;
}
