import type { SetupConfig } from './setupTypes';

export const MAX_GAME_EVENTS = 500;

export interface GameConfig extends SetupConfig {
  allowDoubleWinner: boolean;
  maxPlayerRevivals: number;
  maxGameEvents: number;
}

export function createGameConfig(setupConfig: SetupConfig): GameConfig {
  return {
    ...setupConfig,
    allowDoubleWinner: false,
    maxPlayerRevivals: 1,
    maxGameEvents: MAX_GAME_EVENTS,
  };
}
