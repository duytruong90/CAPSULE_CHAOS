import {
  canonicalStringify,
  formatCommitmentHash,
  type GameCommitment,
} from '../engine/commitment';
import { PRNG_ALGORITHM } from '../engine/rng';
import { generateSecureSeed, normalizeSeed, type RandomValuesSource } from '../engine/seed';
import type { PlayerEntry, SetupConfig } from '../state/setupTypes';
import {
  buildBreakoutTimeline,
  serializeBreakoutTimeline,
  type BreakoutTimeline,
} from './buildBreakoutTimeline';
import { BREAKOUT_RULES } from './config';
import { deriveBreakoutRandomSeeds } from './randomStreams';
import { simulateBreakout } from './simulateBreakout';
import {
  BREAKOUT_ENGINE_RULES_VERSION,
  BREAKOUT_LOCK_SCHEMA_VERSION,
  type BreakoutHostConfig,
  type BreakoutSimulationResult,
  type BreakoutRandomSeeds,
} from './types';

export interface BreakoutLockPayload {
  readonly schemaVersion: typeof BREAKOUT_LOCK_SCHEMA_VERSION;
  readonly rngAlgorithm: typeof PRNG_ALGORITHM;
  readonly engineRulesVersion: typeof BREAKOUT_ENGINE_RULES_VERSION;
  readonly entries: readonly Readonly<{
    id: string;
    displayName: string;
    normalizedName: string;
    entryIndex: number;
  }>[];
  readonly config: Readonly<BreakoutHostConfig>;
  readonly fixedRules: typeof BREAKOUT_RULES;
  readonly seed: string;
}

export interface InternalBreakoutLock {
  readonly payload: BreakoutLockPayload;
  readonly commitment: GameCommitment;
}

export interface PublicBreakoutLock {
  readonly schemaVersion: typeof BREAKOUT_LOCK_SCHEMA_VERSION;
  readonly entryCount: number;
  readonly commitment: Omit<GameCommitment, 'canonicalPayload'>;
}

export interface LockedBreakoutSession {
  readonly lock: InternalBreakoutLock;
  readonly publicLock: PublicBreakoutLock;
  readonly randomSeeds: BreakoutRandomSeeds;
  readonly simulation: BreakoutSimulationResult;
  readonly timeline: BreakoutTimeline;
}

type BreakoutCryptoSource = RandomValuesSource & Pick<Crypto, 'subtle'>;

export interface BreakoutLockOptions {
  readonly seed?: string;
  readonly cryptoSource?: BreakoutCryptoSource;
}

export function createBreakoutHostConfig(config: SetupConfig): BreakoutHostConfig {
  return Object.freeze({
    animationSpeed: config.animationSpeed,
    soundEnabled: config.soundEnabled,
    autoAdvancePhases: config.autoAdvancePhases,
    showFullSurvivorBoard: config.showFullSurvivorBoard,
    allowDuplicateEntries: config.allowDuplicateEntries,
    reducedMotion: config.reducedMotion,
  });
}

export function createBreakoutLockPayload(
  roster: readonly PlayerEntry[],
  config: SetupConfig,
  seed: string,
): BreakoutLockPayload {
  const entries = [...roster]
    .sort((left, right) => left.entryIndex - right.entryIndex)
    .map(({ id, displayName, normalizedName, entryIndex }) =>
      Object.freeze({ id, displayName, normalizedName, entryIndex }),
    );
  if (entries.length === 0) throw new Error('Breakout requires at least one entry.');
  return Object.freeze({
    schemaVersion: BREAKOUT_LOCK_SCHEMA_VERSION,
    rngAlgorithm: PRNG_ALGORITHM,
    engineRulesVersion: BREAKOUT_ENGINE_RULES_VERSION,
    entries: Object.freeze(entries),
    config: createBreakoutHostConfig(config),
    fixedRules: BREAKOUT_RULES,
    seed: normalizeSeed(seed),
  });
}

export async function createBreakoutCommitment(
  payload: BreakoutLockPayload,
  cryptoSource: Pick<Crypto, 'subtle'> = globalThis.crypto,
): Promise<GameCommitment> {
  if (!cryptoSource?.subtle) {
    throw new Error('SHA-256 commitment generation is unavailable in this browser.');
  }
  const canonicalPayload = canonicalStringify(payload);
  const digest = await cryptoSource.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalPayload),
  );
  const fullHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return Object.freeze({
    algorithm: 'SHA-256',
    fullHash,
    displayHash: formatCommitmentHash(fullHash),
    canonicalPayload,
  });
}

export async function createLockedBreakoutSession(
  roster: readonly PlayerEntry[],
  setupConfig: SetupConfig,
  options: BreakoutLockOptions = {},
): Promise<LockedBreakoutSession> {
  const cryptoSource = options.cryptoSource ?? globalThis.crypto;
  const seed = options.seed ?? generateSecureSeed(cryptoSource);
  const payload = createBreakoutLockPayload(roster, setupConfig, seed);
  const commitment = await createBreakoutCommitment(payload, cryptoSource);
  const lock = Object.freeze({ payload, commitment });
  const randomSeeds = await deriveBreakoutRandomSeeds(payload.seed, cryptoSource);
  const simulation = simulateBreakout(payload.entries, randomSeeds, commitment.displayHash);
  const timeline = buildBreakoutTimeline(simulation.events);
  return Object.freeze({
    lock,
    publicLock: Object.freeze({
      schemaVersion: BREAKOUT_LOCK_SCHEMA_VERSION,
      entryCount: payload.entries.length,
      commitment: Object.freeze({
        algorithm: commitment.algorithm,
        fullHash: commitment.fullHash,
        displayHash: commitment.displayHash,
      }),
    }),
    randomSeeds,
    simulation,
    timeline,
  });
}

export async function verifyBreakoutSession(
  session: LockedBreakoutSession,
  cryptoSource: Pick<Crypto, 'subtle'> = globalThis.crypto,
) {
  if (
    session.lock.payload.schemaVersion !== BREAKOUT_LOCK_SCHEMA_VERSION ||
    session.lock.payload.engineRulesVersion !== BREAKOUT_ENGINE_RULES_VERSION
  ) {
    return Object.freeze({ verified: false, error: 'unsupported-rules-version' as const });
  }
  try {
    const commitment = await createBreakoutCommitment(session.lock.payload, cryptoSource);
    const seeds = await deriveBreakoutRandomSeeds(session.lock.payload.seed, cryptoSource);
    const replay = simulateBreakout(session.lock.payload.entries, seeds, commitment.displayHash);
    const timeline = buildBreakoutTimeline(replay.events);
    const verified =
      commitment.fullHash === session.lock.commitment.fullHash &&
      canonicalStringify(seeds) === canonicalStringify(session.randomSeeds) &&
      canonicalStringify(replay) === canonicalStringify(session.simulation) &&
      serializeBreakoutTimeline(timeline) === serializeBreakoutTimeline(session.timeline);
    return Object.freeze({
      verified,
      error: verified ? null : ('session-replay-mismatch' as const),
    });
  } catch {
    return Object.freeze({ verified: false, error: 'session-verification-failed' as const });
  }
}
