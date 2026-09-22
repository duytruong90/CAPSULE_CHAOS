import {
  createGameLock,
  toPublicGameLock,
  type GameLockOptions,
  type InternalGameLock,
  type PublicGameLock,
} from '../engine/commitment';
import { simulateGame } from '../engine/simulateGame';
import { buildTimeline } from '../timeline/buildTimeline';
import type { GameTimeline } from '../timeline/eventTypes';
import type { SimulationResult } from './gameTypes';
import { createGameConfig } from './gameConfig';
import type { PlayerEntry, SetupConfig } from './setupTypes';

export interface LockedGameSession {
  lock: InternalGameLock;
  publicLock: PublicGameLock;
  simulation: SimulationResult;
  timeline: GameTimeline;
}

export async function createLockedGameSession(
  roster: readonly PlayerEntry[],
  setupConfig: SetupConfig,
  options: GameLockOptions = {},
): Promise<LockedGameSession> {
  const config = createGameConfig(setupConfig);
  const lock = await createGameLock(roster, config, options);
  const simulation = simulateGame({
    roster,
    config,
    seed: lock.payload.seed,
  });
  const timeline = buildTimeline(simulation);

  return Object.freeze({
    lock,
    publicLock: Object.freeze(toPublicGameLock(lock)),
    simulation,
    timeline,
  });
}
