import type { PlayerEntry } from '../state/setupTypes';
import type { GameConfig } from '../state/gameConfig';
import { PRNG_ALGORITHM } from './rng';
import { ENGINE_RULES_VERSION } from '../state/gameTypes';
import { generateSecureSeed, normalizeSeed, type RandomValuesSource } from './seed';

export const LOCK_SCHEMA_VERSION = 'capsule-chaos-lock-v3' as const;

export interface LockedEntry {
  id: string;
  displayName: string;
  normalizedName: string;
  entryIndex: number;
}

export interface GameLockPayload {
  readonly schemaVersion: typeof LOCK_SCHEMA_VERSION;
  readonly rngAlgorithm: typeof PRNG_ALGORITHM;
  readonly engineRulesVersion: typeof ENGINE_RULES_VERSION;
  readonly entries: readonly Readonly<LockedEntry>[];
  readonly config: Readonly<GameConfig>;
  readonly seed: string;
}

export interface GameCommitment {
  algorithm: 'SHA-256';
  fullHash: string;
  displayHash: string;
  canonicalPayload: string;
}

export interface InternalGameLock {
  payload: GameLockPayload;
  commitment: GameCommitment;
}

export interface PublicGameLock {
  schemaVersion: typeof LOCK_SCHEMA_VERSION;
  entryCount: number;
  commitment: Omit<GameCommitment, 'canonicalPayload'>;
}

type DigestSource = Pick<Crypto, 'subtle'>;
type LockCryptoSource = RandomValuesSource & DigestSource;

export interface GameLockOptions {
  seed?: string;
  cryptoSource?: LockCryptoSource;
}

function serializeCanonicalValue(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical payloads cannot contain non-finite numbers.');
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(serializeCanonicalValue).join(',')}]`;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((key) => {
        const propertyValue = record[key];
        if (propertyValue === undefined) {
          throw new TypeError('Canonical payloads cannot contain undefined values.');
        }
        return `${JSON.stringify(key)}:${serializeCanonicalValue(propertyValue)}`;
      })
      .join(',')}}`;
  }

  throw new TypeError(`Unsupported canonical payload value: ${typeof value}.`);
}

export function canonicalStringify(value: unknown) {
  return serializeCanonicalValue(value);
}

export function createGameLockPayload(
  roster: readonly PlayerEntry[],
  config: GameConfig,
  seed: string,
): GameLockPayload {
  const entries = [...roster]
    .sort((left, right) => left.entryIndex - right.entryIndex)
    .map(({ id, displayName, normalizedName, entryIndex }) => ({
      id,
      displayName,
      normalizedName,
      entryIndex,
    }));

  return Object.freeze({
    schemaVersion: LOCK_SCHEMA_VERSION,
    rngAlgorithm: PRNG_ALGORITHM,
    engineRulesVersion: ENGINE_RULES_VERSION,
    entries: Object.freeze(entries.map((entry) => Object.freeze(entry))),
    config: Object.freeze({ ...config }),
    seed: normalizeSeed(seed),
  });
}

export function formatCommitmentHash(fullHash: string) {
  return (
    fullHash
      .slice(0, 16)
      .toUpperCase()
      .match(/.{1,4}/gu)
      ?.join('-') ?? ''
  );
}

export async function createCommitment(
  payload: GameLockPayload,
  cryptoSource: DigestSource = globalThis.crypto,
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

export async function createGameLock(
  roster: readonly PlayerEntry[],
  config: GameConfig,
  options: GameLockOptions = {},
): Promise<InternalGameLock> {
  const cryptoSource = options.cryptoSource ?? globalThis.crypto;
  const seed = options.seed ?? generateSecureSeed(cryptoSource);
  const payload = createGameLockPayload(roster, config, seed);
  const commitment = await createCommitment(payload, cryptoSource);

  return Object.freeze({ payload, commitment });
}

export function toPublicGameLock(lock: InternalGameLock): PublicGameLock {
  return Object.freeze({
    schemaVersion: lock.payload.schemaVersion,
    entryCount: lock.payload.entries.length,
    commitment: Object.freeze({
      algorithm: lock.commitment.algorithm,
      fullHash: lock.commitment.fullHash,
      displayHash: lock.commitment.displayHash,
    }),
  });
}
