import { selectInPlayPlayers } from '../engine/selectors';
import { canRevivePlayer } from '../state/gameReducer';
import type { ProtectionKind } from '../state/gameTypes';
import { CardEffectRegistry } from './cardRegistry';
import type { CardEffectContext, ChaosCardDefinition } from './cardTypes';

export const PHASE_ONE_CARDS: readonly ChaosCardDefinition[] = Object.freeze(
  [
    {
      id: 'shield',
      name: 'Shield',
      rarity: 'common',
      weight: 4,
      description: 'One shield blocks this elimination, then is consumed.',
    },
    {
      id: 'second-life',
      name: 'Second Life',
      rarity: 'rare',
      weight: 2,
      description: 'A second life rescues this player from the current elimination.',
    },
    {
      id: 'double-trouble',
      name: 'Double Trouble',
      rarity: 'common',
      weight: 3,
      description: 'After this elimination, two more players face elimination checks.',
    },
    {
      id: 'revive',
      name: 'Revive',
      rarity: 'rare',
      weight: 1,
      description: 'After this elimination, one eliminated player returns to play.',
    },
    {
      id: 'reverse',
      name: 'Reverse',
      rarity: 'rare',
      weight: 2,
      description: 'This player is safe; the next standard draw is marked for elimination.',
    },
    {
      id: 'lucky-escape',
      name: 'Lucky Escape',
      rarity: 'common',
      weight: 4,
      description: 'This player escapes with no stored protection.',
    },
  ].map((card) =>
    Object.freeze({
      ...card,
      rarity: card.rarity as ChaosCardDefinition['rarity'],
      phasesAllowed: Object.freeze(['phase-1'] as const),
      presentationKey: `card.${card.id}`,
    }),
  ),
);

export type PhaseOneAction =
  | { type: 'eliminate' | 'draw' | 'safe' | 'revive'; playerId: string }
  | { type: 'grant'; playerId: string; protection: ProtectionKind }
  | { type: 'mark-next' };

export interface PhaseOneEffect {
  actions: readonly PhaseOneAction[];
  resultText: string;
}

const revivalTargets = ({ state }: CardEffectContext) =>
  state.players.filter((player) => canRevivePlayer(player, state.config));

export const phaseOneCardRegistry = new CardEffectRegistry<PhaseOneEffect>();

for (const card of PHASE_ONE_CARDS) {
  phaseOneCardRegistry.register({
    id: card.id,
    ...(card.id === 'lucky-escape' ? {} : { fallbackCardId: 'lucky-escape' }),
    isEligible: (context) => {
      const active = selectInPlayPlayers(context.state.players);
      if (context.state.phase !== 'phase-1' || !active.some((p) => p.id === context.actorId))
        return false;
      if (card.id === 'revive') return revivalTargets(context).length > 0;
      // Never truncate a two-target effect or overshoot the phase target.
      if (card.id === 'double-trouble')
        return active.length - (context.targetCount ?? active.length) >= 3;
      return true;
    },
    resolve: (context) => {
      const { actorId, rng, state } = context;
      const actions: PhaseOneAction[] = [];
      const participants = [actorId];
      let resultText = 'SAFE';
      switch (card.id) {
        case 'shield':
        case 'second-life':
          actions.push(
            { type: 'grant', playerId: actorId, protection: card.id },
            { type: 'eliminate', playerId: actorId },
          );
          resultText = card.id === 'shield' ? 'BLOCKED · SAFE' : 'NOT YET · SAFE';
          break;
        case 'double-trouble': {
          const targets = rng
            .shuffle(selectInPlayPlayers(state.players).filter((p) => p.id !== actorId))
            .slice(0, 2);
          actions.push({ type: 'eliminate', playerId: actorId });
          for (const target of targets) {
            participants.push(target.id);
            actions.push(
              { type: 'draw', playerId: target.id },
              { type: 'eliminate', playerId: target.id },
            );
          }
          resultText = 'TWO MORE ELIMINATION CHECKS';
          break;
        }
        case 'revive': {
          const target = rng.choose(revivalTargets(context));
          participants.push(target.id);
          actions.push(
            { type: 'eliminate', playerId: actorId },
            { type: 'revive', playerId: target.id },
          );
          resultText = 'ONE PLAYER RETURNS';
          break;
        }
        case 'reverse':
          actions.push({ type: 'safe', playerId: actorId }, { type: 'mark-next' });
          resultText = 'SAFE · NEXT DRAW MARKED';
          break;
        default:
          actions.push({ type: 'safe', playerId: actorId });
      }
      return { cardId: card.id, participants, payload: { actions, resultText } };
    },
  });
}
