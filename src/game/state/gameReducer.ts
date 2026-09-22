import type { GameConfig } from './gameConfig';
import type { Player, PlayerHistoryEvent, ProtectionKind } from './gameTypes';

export type PlayerAction =
  | { type: 'eliminate' }
  | { type: 'mark-safe' }
  | { type: 'activate' }
  | { type: 'mark-finalist' }
  | { type: 'declare-winner' }
  | { type: 'revive'; maxRevivals: number }
  | { type: 'grant-protection'; protection: ProtectionKind; charges?: number };

export interface PlayerTransition {
  player: Player;
  outcome:
    | 'eliminated'
    | 'shield-consumed'
    | 'second-life-consumed'
    | 'safe'
    | 'active'
    | 'finalist'
    | 'winner'
    | 'revived'
    | 'protection-granted';
}

export function createInitialPlayer(entry: {
  id: string;
  displayName: string;
  normalizedName: string;
  entryIndex: number;
  sourceLineNumber: number;
}): Player {
  return {
    ...entry,
    state: 'active',
    shieldCharges: 0,
    secondLifeCharges: 0,
    eliminationCount: 0,
    revivalCount: 0,
    history: [],
  };
}

export function reducePlayer(player: Player, action: PlayerAction): PlayerTransition {
  switch (action.type) {
    case 'eliminate':
      if (player.state === 'eliminated' || player.state === 'winner') {
        throw new Error(`Player ${player.id} cannot be eliminated from state ${player.state}.`);
      }
      if (player.shieldCharges > 0) {
        return {
          player: { ...player, shieldCharges: player.shieldCharges - 1 },
          outcome: 'shield-consumed',
        };
      }
      if (player.secondLifeCharges > 0) {
        return {
          player: { ...player, secondLifeCharges: player.secondLifeCharges - 1 },
          outcome: 'second-life-consumed',
        };
      }
      return {
        player: {
          ...player,
          state: 'eliminated',
          eliminationCount: player.eliminationCount + 1,
        },
        outcome: 'eliminated',
      };
    case 'mark-safe':
      if (player.state === 'eliminated' || player.state === 'winner') {
        throw new Error(`Player ${player.id} cannot be marked safe from state ${player.state}.`);
      }
      return { player: { ...player, state: 'safe' }, outcome: 'safe' };
    case 'activate':
      if (player.state === 'eliminated' || player.state === 'winner') {
        throw new Error(`Player ${player.id} cannot be activated from state ${player.state}.`);
      }
      return { player: { ...player, state: 'active' }, outcome: 'active' };
    case 'mark-finalist':
      if (player.state === 'eliminated' || player.state === 'winner') {
        throw new Error(`Player ${player.id} cannot become a finalist from state ${player.state}.`);
      }
      return { player: { ...player, state: 'finalist' }, outcome: 'finalist' };
    case 'declare-winner':
      if (player.state === 'eliminated') {
        throw new Error(`Eliminated player ${player.id} cannot be declared the winner.`);
      }
      return { player: { ...player, state: 'winner' }, outcome: 'winner' };
    case 'revive':
      if (player.state !== 'eliminated') {
        throw new Error(`Only eliminated players can be revived: ${player.id}.`);
      }
      if (player.revivalCount >= action.maxRevivals) {
        throw new Error(`Player ${player.id} has reached the revival limit.`);
      }
      return {
        player: { ...player, state: 'revived', revivalCount: player.revivalCount + 1 },
        outcome: 'revived',
      };
    case 'grant-protection': {
      if (player.state === 'eliminated' || player.state === 'winner') {
        throw new Error(
          `Player ${player.id} cannot receive protection from state ${player.state}.`,
        );
      }
      const charges = action.charges ?? 1;
      if (!Number.isSafeInteger(charges) || charges <= 0) {
        throw new RangeError('Protection charges must be a positive safe integer.');
      }
      return {
        player: {
          ...player,
          shieldCharges:
            action.protection === 'shield' ? player.shieldCharges + charges : player.shieldCharges,
          secondLifeCharges:
            action.protection === 'second-life'
              ? player.secondLifeCharges + charges
              : player.secondLifeCharges,
        },
        outcome: 'protection-granted',
      };
    }
  }
}

export function appendPlayerHistory(player: Player, event: PlayerHistoryEvent): Player {
  return { ...player, history: [...player.history, event] };
}

export function canRevivePlayer(player: Player, config: Pick<GameConfig, 'maxPlayerRevivals'>) {
  return player.state === 'eliminated' && player.revivalCount < config.maxPlayerRevivals;
}

export function revivePlayer(player: Player, config: GameConfig) {
  if (!canRevivePlayer(player, config)) {
    throw new Error(`Player ${player.id} is not eligible for revival.`);
  }
  return reducePlayer(player, { type: 'revive', maxRevivals: config.maxPlayerRevivals });
}
