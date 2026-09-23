import { ALL_CHAOS_CARDS, chaosCardRegistry, type CardAction, type CardEffect } from './allCards';

export const PHASE_ONE_CARDS = ALL_CHAOS_CARDS.filter((card) =>
  card.phasesAllowed.includes('phase-1'),
);
export const phaseOneCardRegistry = chaosCardRegistry;
export type PhaseOneAction = CardAction;
export type PhaseOneEffect = CardEffect;
