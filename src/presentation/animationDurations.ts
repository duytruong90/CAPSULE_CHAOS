import type { CardRarity } from '../game/cards/cardTypes';
import type { AnimationSpeed } from '../game/state/setupTypes';
import type { TimelineEvent } from '../game/timeline/eventTypes';

export const SPEED_MULTIPLIERS: Readonly<Record<AnimationSpeed, number>> = {
  fast: 0.6,
  normal: 1,
  cinematic: 1.5,
};
export const CARD_DURATIONS: Readonly<Record<CardRarity, number>> = {
  common: 1800,
  rare: 2800,
  epic: 3600,
  legendary: 6000,
};
export const INTRO_DURATION = 2400;
export const SKIP_HOLD_DURATION = 180;

export function eventDuration(event: TimelineEvent, speed: AnimationSpeed, entryCount = 50) {
  const base =
    event.type === 'card-reveal'
      ? Math.max(event.minimumDurationMs, CARD_DURATIONS[event.payload.rarity])
      : event.minimumDurationMs;
  const openingBoost =
    entryCount > 60 &&
    event.phase === 'phase-1' &&
    (event.type === 'capsule-spin' || event.type === 'player-reveal')
      ? 0.8
      : 1;
  return Math.round(base * SPEED_MULTIPLIERS[speed] * openingBoost);
}

export function reactionDuration(event: TimelineEvent, speed: AnimationSpeed) {
  const base = ['elimination', 'safe', 'protection', 'revival'].includes(event.type) ? 2200 : 250;
  return Math.round(base * SPEED_MULTIPLIERS[speed]);
}
