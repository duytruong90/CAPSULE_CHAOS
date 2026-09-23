import type { SeededRng } from '../engine/rng';
import type { GameStateSnapshot } from '../state/gameTypes';

export interface CardEffectContext {
  state: Readonly<GameStateSnapshot>;
  actorId: string;
  rng: SeededRng;
  targetCount?: number;
  previousReversibleCardId?: string;
}

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ChaosCardDefinition {
  readonly id: string;
  readonly name: string;
  readonly rarity: CardRarity;
  readonly phasesAllowed: readonly GameStateSnapshot['phase'][];
  readonly weight: number;
  readonly description: string;
  readonly presentationKey: string;
}

export interface CardEffectResolution<Payload = unknown> {
  cardId: string;
  participants: readonly string[];
  payload: Payload;
}

export interface CardEffectDefinition<Payload = unknown> {
  id: string;
  fallbackCardId?: string;
  isEligible: (context: CardEffectContext) => boolean;
  resolve: (context: CardEffectContext) => CardEffectResolution<Payload>;
}
