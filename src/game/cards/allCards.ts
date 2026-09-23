import { selectInPlayPlayers } from '../engine/selectors';
import { canRevivePlayer } from '../state/gameReducer';
import type { GamePhase, ProtectionKind } from '../state/gameTypes';
import { CardEffectRegistry } from './cardRegistry';
import type { CardEffectContext, ChaosCardDefinition } from './cardTypes';

export type CardAction =
  | { type: 'eliminate' | 'draw' | 'safe' | 'revive'; playerId: string }
  | { type: 'grant'; playerId: string; protection: ProtectionKind }
  | { type: 'steal'; fromPlayerId: string; toPlayerId: string; protection: ProtectionKind }
  | { type: 'lock'; playerId: string }
  | { type: 'mark-next' }
  | { type: 'nullify-previous' }
  | { type: 'duel'; winnerId: string; loserId: string };

export interface CardEffect {
  actions: readonly CardAction[];
  resultText: string;
  subEffect?: 'rescue' | 'revive' | 'duel' | 'no-elimination';
}

type CardSeed = Omit<ChaosCardDefinition, 'presentationKey'>;
const card = (definition: CardSeed): ChaosCardDefinition =>
  Object.freeze({ ...definition, presentationKey: `card.${definition.id}` });

const EARLY: readonly GamePhase[] = ['phase-1', 'phase-2', 'phase-3'];
const CHAOS: readonly GamePhase[] = ['phase-2', 'phase-3'];

export const ALL_CHAOS_CARDS: readonly ChaosCardDefinition[] = Object.freeze([
  card({
    id: 'shield',
    name: 'Shield',
    rarity: 'common',
    phasesAllowed: EARLY,
    weight: 4,
    description: 'A shield blocks this elimination.',
  }),
  card({
    id: 'second-life',
    name: 'Second Life',
    rarity: 'rare',
    phasesAllowed: EARLY,
    weight: 2,
    description: 'A second life rescues this player from elimination.',
  }),
  card({
    id: 'double-trouble',
    name: 'Double Trouble',
    rarity: 'common',
    phasesAllowed: EARLY,
    weight: 3,
    description: 'Two more active players face elimination checks.',
  }),
  card({
    id: 'revive',
    name: 'Revive',
    rarity: 'rare',
    phasesAllowed: EARLY,
    weight: 1,
    description: 'One eligible eliminated player returns.',
  }),
  card({
    id: 'reverse',
    name: 'Reverse',
    rarity: 'rare',
    phasesAllowed: [...EARLY, 'phase-5'],
    weight: 2,
    description: 'The current fate is reversed and the next draw is marked.',
  }),
  card({
    id: 'lucky-escape',
    name: 'Lucky Escape',
    rarity: 'common',
    phasesAllowed: EARLY,
    weight: 4,
    description: 'The selected player escapes with no stored protection.',
  }),
  card({
    id: 'mirror',
    name: 'Mirror',
    rarity: 'epic',
    phasesAllowed: CHAOS,
    weight: 2,
    description: 'The elimination reflects to another active player.',
  }),
  card({
    id: 'chaos-bomb',
    name: 'Chaos Bomb',
    rarity: 'epic',
    phasesAllowed: CHAOS,
    weight: 1,
    description: 'Three players enter; one is the base survivor.',
  }),
  card({
    id: 'duel',
    name: 'Duel',
    rarity: 'rare',
    phasesAllowed: [...CHAOS, 'phase-5'],
    weight: 2,
    description: 'Two distinct players duel; the seeded loser faces elimination.',
  }),
  card({
    id: 'steal',
    name: 'Steal',
    rarity: 'rare',
    phasesAllowed: CHAOS,
    weight: 2,
    description: 'Transfer a Shield or Second Life from an eligible player.',
  }),
  card({
    id: 'nullify',
    name: 'Nullify',
    rarity: 'epic',
    phasesAllowed: CHAOS,
    weight: 1,
    description: 'Cancel the immediately preceding reversible Chaos effect.',
  }),
  card({
    id: 'final-pass',
    name: 'Final Pass',
    rarity: 'epic',
    phasesAllowed: CHAOS,
    weight: 1,
    description: 'Immune until the next phase boundary.',
  }),
  card({
    id: 'ghost-return',
    name: 'Ghost Return',
    rarity: 'epic',
    phasesAllowed: CHAOS,
    weight: 1,
    description: 'An eliminated player returns with no stored protection.',
  }),
  card({
    id: 'fate-swap',
    name: 'Fate Swap',
    rarity: 'epic',
    phasesAllowed: [...CHAOS, 'phase-5'],
    weight: 1,
    description: 'The current player survives and another valid target takes their fate.',
  }),
  card({
    id: 'system-override',
    name: 'System Override',
    rarity: 'legendary',
    phasesAllowed: ['phase-3', 'phase-5', 'final'],
    weight: 0.45,
    description: 'A seeded system sub-effect overrides the current result.',
  }),
  card({
    id: 'jackpot',
    name: 'Jackpot',
    rarity: 'legendary',
    phasesAllowed: ['phase-4', 'phase-5', 'final'],
    weight: 0.35,
    description: 'Maximum survival: the current player survives and one player may return.',
  }),
]);

export const cardById = (id: string) => ALL_CHAOS_CARDS.find((entry) => entry.id === id);

const active = (context: CardEffectContext) => selectInPlayPlayers(context.state.players);
const revivable = (context: CardEffectContext) =>
  context.state.players.filter((player) => canRevivePlayer(player, context.state.config));
const opponents = (context: CardEffectContext) =>
  active(context).filter((player) => player.id !== context.actorId && !player.lockedUntilPhase);
const enoughEliminations = (context: CardEffectContext, count: number) =>
  active(context).length - (context.targetCount ?? 0) >= count;

export const chaosCardRegistry = new CardEffectRegistry<CardEffect>();

for (const definition of ALL_CHAOS_CARDS) {
  chaosCardRegistry.register({
    id: definition.id,
    ...(definition.id === 'lucky-escape' ? {} : { fallbackCardId: 'lucky-escape' }),
    isEligible: (context) => {
      if (!definition.phasesAllowed.includes(context.state.phase)) return false;
      if (!active(context).some((player) => player.id === context.actorId)) return false;
      switch (definition.id) {
        case 'double-trouble':
          return opponents(context).length >= 2 && enoughEliminations(context, 3);
        case 'revive':
        case 'ghost-return':
          return revivable(context).length > 0 && enoughEliminations(context, 1);
        case 'mirror':
        case 'fate-swap':
          return opponents(context).length > 0 && enoughEliminations(context, 1);
        case 'chaos-bomb':
          return opponents(context).length >= 2 && enoughEliminations(context, 2);
        case 'duel':
          return opponents(context).length > 0 && enoughEliminations(context, 1);
        case 'steal':
          return true; // Explicitly falls back to Lucky Escape when nobody is stealable.
        case 'nullify':
          return Boolean(context.previousReversibleCardId);
        case 'final-pass':
          return (
            active(context).filter((player) => Boolean(player.lockedUntilPhase)).length <
            (context.targetCount ?? 0)
          );
        case 'system-override':
          return active(context).length <= 10;
        case 'jackpot':
          return active(context).length <= 5;
        default:
          return true;
      }
    },
    resolve: (context) => {
      const actions: CardAction[] = [];
      const participants = [context.actorId];
      let resultText = 'SAFE';
      let subEffect: CardEffect['subEffect'];
      const pickOpponent = () => context.rng.choose(opponents(context));
      const pickRevival = () => context.rng.choose(revivable(context));

      switch (definition.id) {
        case 'shield':
        case 'second-life':
          actions.push(
            { type: 'grant', playerId: context.actorId, protection: definition.id },
            { type: 'eliminate', playerId: context.actorId },
          );
          resultText = definition.id === 'shield' ? 'BLOCKED · SAFE' : 'NOT YET · SAFE';
          break;
        case 'double-trouble': {
          const targets = context.rng.shuffle(opponents(context)).slice(0, 2);
          actions.push({ type: 'eliminate', playerId: context.actorId });
          targets.forEach((target) => {
            participants.push(target.id);
            actions.push(
              { type: 'draw', playerId: target.id },
              { type: 'eliminate', playerId: target.id },
            );
          });
          resultText = 'TWO MORE ELIMINATION CHECKS';
          break;
        }
        case 'revive':
        case 'ghost-return': {
          const target = pickRevival();
          participants.push(target.id);
          actions.push(
            { type: 'eliminate', playerId: context.actorId },
            { type: 'revive', playerId: target.id },
          );
          resultText = definition.id === 'revive' ? 'ONE PLAYER RETURNS' : 'THE GHOST RETURNS';
          break;
        }
        case 'reverse':
          actions.push({ type: 'safe', playerId: context.actorId }, { type: 'mark-next' });
          resultText = 'SAFE · NEXT DRAW MARKED';
          break;
        case 'mirror':
        case 'fate-swap': {
          const target = pickOpponent();
          participants.push(target.id);
          actions.push(
            { type: 'safe', playerId: context.actorId },
            { type: 'eliminate', playerId: target.id },
          );
          resultText = definition.id === 'mirror' ? 'FATE REFLECTED' : 'FATE SWAPPED';
          break;
        }
        case 'chaos-bomb': {
          const trio = [
            context.state.players.find((p) => p.id === context.actorId)!,
            ...context.rng.shuffle(opponents(context)).slice(0, 2),
          ];
          const survivor = context.rng.choose(trio);
          trio.slice(1).forEach((player) => participants.push(player.id));
          actions.push({ type: 'safe', playerId: survivor.id });
          trio
            .filter((player) => player.id !== survivor.id)
            .forEach((player) => actions.push({ type: 'eliminate', playerId: player.id }));
          resultText = `BASE SURVIVOR · ${survivor.displayName}`;
          break;
        }
        case 'duel': {
          const opponent = pickOpponent();
          const winner = context.rng.choose([context.actorId, opponent.id]);
          const loser = winner === context.actorId ? opponent.id : context.actorId;
          participants.push(opponent.id);
          actions.push({ type: 'duel', winnerId: winner, loserId: loser });
          resultText = 'DUEL RESOLVED';
          break;
        }
        case 'steal': {
          const eligible = opponents(context).filter(
            (player) => player.shieldCharges + player.secondLifeCharges > 0,
          );
          if (!eligible.length) return chaosCardRegistry.resolve('lucky-escape', context);
          const target = context.rng.choose(eligible);
          const protection: ProtectionKind =
            target.shieldCharges > 0 &&
            (target.secondLifeCharges === 0 || context.rng.nextFloat() < 0.5)
              ? 'shield'
              : 'second-life';
          participants.push(target.id);
          actions.push(
            { type: 'steal', fromPlayerId: target.id, toPlayerId: context.actorId, protection },
            { type: 'safe', playerId: context.actorId },
          );
          resultText = `ABILITY STOLEN · ${protection === 'shield' ? 'SHIELD' : 'SECOND LIFE'}`;
          break;
        }
        case 'nullify':
          actions.push({ type: 'nullify-previous' }, { type: 'safe', playerId: context.actorId });
          resultText = `CHAOS DENIED · ${context.previousReversibleCardId}`;
          break;
        case 'final-pass':
          actions.push(
            { type: 'lock', playerId: context.actorId },
            { type: 'safe', playerId: context.actorId },
          );
          resultText = 'SAFE UNTIL NEXT PHASE';
          break;
        case 'system-override': {
          const choices: NonNullable<CardEffect['subEffect']>[] = ['rescue', 'no-elimination'];
          if (revivable(context).length > 0) choices.push('revive');
          if (opponents(context).length > 0 && enoughEliminations(context, 1)) choices.push('duel');
          subEffect = context.rng.choose(choices);
          if (subEffect === 'revive') {
            const target = pickRevival();
            participants.push(target.id);
            actions.push(
              { type: 'eliminate', playerId: context.actorId },
              { type: 'revive', playerId: target.id },
            );
          } else if (subEffect === 'duel') {
            const opponent = pickOpponent();
            const winner = context.rng.choose([context.actorId, opponent.id]);
            const loser = winner === context.actorId ? opponent.id : context.actorId;
            participants.push(opponent.id);
            actions.push({ type: 'duel', winnerId: winner, loserId: loser });
          } else actions.push({ type: 'safe', playerId: context.actorId });
          resultText = `OVERRIDE · ${subEffect.toUpperCase()}`;
          break;
        }
        case 'jackpot': {
          actions.push({ type: 'safe', playerId: context.actorId });
          if (revivable(context).length > 0) {
            const target = pickRevival();
            participants.push(target.id);
            actions.push({ type: 'revive', playerId: target.id });
          }
          resultText =
            context.state.config.allowDoubleWinner && context.state.phase === 'final'
              ? 'DOUBLE WINNER ENABLED'
              : 'MAXIMUM SURVIVAL';
          break;
        }
        default:
          actions.push({ type: 'safe', playerId: context.actorId });
      }
      return {
        cardId: definition.id,
        participants,
        payload: { actions, resultText, ...(subEffect ? { subEffect } : {}) },
      };
    },
  });
}

export function eligibleCards(context: CardEffectContext, legendaryCount: number) {
  return ALL_CHAOS_CARDS.filter((definition) => {
    if (definition.rarity === 'legendary' && legendaryCount >= 2) return false;
    return chaosCardRegistry.get(definition.id)?.isEligible(context);
  });
}
