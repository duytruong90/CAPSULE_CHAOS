import type { SeededRng } from '../engine/rng';
import type { GameStateSnapshot } from '../state/gameTypes';

export interface CardEffectContext {
  state: Readonly<GameStateSnapshot>;
  actorId: string;
  rng: SeededRng;
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
