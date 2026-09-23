import type { BreakoutPlaybackCheckpoint } from '../../presentation/breakout/BreakoutPlaybackController';
import { BREAKOUT_SESSION_SCHEMA_VERSION } from './types';
import type { LockedBreakoutSession } from './session';

export const BREAKOUT_DATABASE_NAME = 'capsule-chaos-breakout';
export const BREAKOUT_DATABASE_VERSION = 1;
export const LEGACY_SESSION_STORAGE_KEY = 'capsule-chaos.active-session.v1';

const SESSION_STORE = 'sessions';
const CHECKPOINT_STORE = 'checkpoints';
const ACTIVE_KEY = 'active';

export interface PersistedBreakoutSession {
  readonly schemaVersion: typeof BREAKOUT_SESSION_SCHEMA_VERSION;
  readonly savedAt: string;
  readonly giveawayName: string;
  readonly session: LockedBreakoutSession;
}

export interface PersistedBreakoutCheckpoint {
  readonly schemaVersion: typeof BREAKOUT_SESSION_SCHEMA_VERSION;
  readonly savedAt: string;
  readonly commitmentHash: string;
  readonly checkpoint: BreakoutPlaybackCheckpoint;
}

export interface BreakoutRecoveryRecord {
  readonly savedSession: PersistedBreakoutSession;
  readonly savedCheckpoint: PersistedBreakoutCheckpoint | null;
}

export class BreakoutRecoveryValidationError extends Error {
  readonly savedBytes: string;

  constructor(message: string, savedSession: unknown, savedCheckpoint: unknown) {
    super(message);
    this.name = 'BreakoutRecoveryValidationError';
    this.savedBytes = `${JSON.stringify({ savedSession, savedCheckpoint }, null, 2)}\n`;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateBreakoutRecoveryRecords(
  savedSession: unknown,
  savedCheckpoint: unknown,
): BreakoutRecoveryRecord | null {
  if (savedSession === undefined || savedSession === null) return null;
  if (!isObject(savedSession) || savedSession.schemaVersion !== BREAKOUT_SESSION_SCHEMA_VERSION) {
    throw new BreakoutRecoveryValidationError(
      'unsupported-rules-version',
      savedSession,
      savedCheckpoint,
    );
  }
  const sessionRecord = savedSession as unknown as PersistedBreakoutSession;
  if (
    !isObject(sessionRecord.session) ||
    !isObject(sessionRecord.session.lock) ||
    !isObject(sessionRecord.session.lock.commitment) ||
    typeof sessionRecord.session.lock.commitment.fullHash !== 'string'
  ) {
    throw new BreakoutRecoveryValidationError(
      'malformed-breakout-session',
      savedSession,
      savedCheckpoint,
    );
  }
  if (savedCheckpoint === undefined || savedCheckpoint === null) {
    return Object.freeze({ savedSession: sessionRecord, savedCheckpoint: null });
  }
  if (!isObject(savedCheckpoint)) {
    throw new BreakoutRecoveryValidationError(
      'malformed-breakout-checkpoint',
      savedSession,
      savedCheckpoint,
    );
  }
  const checkpointRecord = savedCheckpoint as unknown as PersistedBreakoutCheckpoint;
  if (checkpointRecord.schemaVersion !== BREAKOUT_SESSION_SCHEMA_VERSION) {
    throw new BreakoutRecoveryValidationError(
      'unsupported-rules-version',
      savedSession,
      savedCheckpoint,
    );
  }
  if (checkpointRecord.commitmentHash !== sessionRecord.session.lock.commitment.fullHash) {
    throw new BreakoutRecoveryValidationError(
      'checkpoint-commitment-mismatch',
      savedSession,
      savedCheckpoint,
    );
  }
  if (
    !isObject(checkpointRecord.checkpoint) ||
    typeof checkpointRecord.checkpoint.eventIndex !== 'number' ||
    typeof checkpointRecord.checkpoint.elapsedBaseMs !== 'number' ||
    typeof checkpointRecord.checkpoint.paused !== 'boolean'
  ) {
    throw new BreakoutRecoveryValidationError(
      'malformed-breakout-checkpoint',
      savedSession,
      savedCheckpoint,
    );
  }
  const timeline = sessionRecord.session.timeline as unknown;
  const timelineEvents: unknown = isObject(timeline) ? timeline.events : undefined;
  const checkpoint = checkpointRecord.checkpoint;
  const checkpointEvent: unknown = Array.isArray(timelineEvents)
    ? (timelineEvents as unknown[])[checkpoint.eventIndex]
    : undefined;
  if (
    !Number.isInteger(checkpoint.eventIndex) ||
    checkpoint.eventIndex < 0 ||
    !Number.isFinite(checkpoint.elapsedBaseMs) ||
    checkpoint.elapsedBaseMs < 0 ||
    !isObject(checkpointEvent) ||
    typeof checkpointEvent.durationBaseMs !== 'number' ||
    checkpoint.elapsedBaseMs > checkpointEvent.durationBaseMs ||
    (checkpoint.atManualBoundary !== undefined &&
      typeof checkpoint.atManualBoundary !== 'boolean') ||
    (checkpoint.complete !== undefined && typeof checkpoint.complete !== 'boolean') ||
    (checkpoint.checkpointRevision !== undefined &&
      (!Number.isInteger(checkpoint.checkpointRevision) || checkpoint.checkpointRevision < 0))
  ) {
    throw new BreakoutRecoveryValidationError(
      'malformed-breakout-checkpoint',
      savedSession,
      savedCheckpoint,
    );
  }
  return Object.freeze({ savedSession: sessionRecord, savedCheckpoint: checkpointRecord });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted.'));
  });
}

export function openBreakoutDatabase(factory: IDBFactory = globalThis.indexedDB) {
  if (!factory) return Promise.reject(new Error('IndexedDB is unavailable.'));
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(BREAKOUT_DATABASE_NAME, BREAKOUT_DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SESSION_STORE)) {
        database.createObjectStore(SESSION_STORE);
      }
      if (!database.objectStoreNames.contains(CHECKPOINT_STORE)) {
        database.createObjectStore(CHECKPOINT_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'));
  });
}

export async function saveBreakoutSession(
  giveawayName: string,
  session: LockedBreakoutSession,
  factory: IDBFactory = globalThis.indexedDB,
) {
  const database = await openBreakoutDatabase(factory);
  try {
    const transaction = database.transaction(SESSION_STORE, 'readwrite');
    const record: PersistedBreakoutSession = Object.freeze({
      schemaVersion: BREAKOUT_SESSION_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      giveawayName,
      session,
    });
    transaction.objectStore(SESSION_STORE).put(record, ACTIVE_KEY);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function saveBreakoutCheckpoint(
  session: LockedBreakoutSession,
  checkpoint: BreakoutPlaybackCheckpoint,
  factory: IDBFactory = globalThis.indexedDB,
) {
  const database = await openBreakoutDatabase(factory);
  try {
    const transaction = database.transaction(CHECKPOINT_STORE, 'readwrite');
    const record: PersistedBreakoutCheckpoint = Object.freeze({
      schemaVersion: BREAKOUT_SESSION_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      commitmentHash: session.lock.commitment.fullHash,
      checkpoint: Object.freeze({ ...checkpoint }),
    });
    transaction.objectStore(CHECKPOINT_STORE).put(record, ACTIVE_KEY);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function loadBreakoutRecovery(
  factory: IDBFactory = globalThis.indexedDB,
): Promise<BreakoutRecoveryRecord | null> {
  const database = await openBreakoutDatabase(factory);
  try {
    const transaction = database.transaction([SESSION_STORE, CHECKPOINT_STORE], 'readonly');
    const [savedSession, savedCheckpoint] = await Promise.all([
      requestResult<unknown>(transaction.objectStore(SESSION_STORE).get(ACTIVE_KEY)),
      requestResult<unknown>(transaction.objectStore(CHECKPOINT_STORE).get(ACTIVE_KEY)),
    ]);
    return validateBreakoutRecoveryRecords(savedSession, savedCheckpoint);
  } finally {
    database.close();
  }
}

export async function clearBreakoutRecovery(factory: IDBFactory = globalThis.indexedDB) {
  const database = await openBreakoutDatabase(factory);
  try {
    const transaction = database.transaction([SESSION_STORE, CHECKPOINT_STORE], 'readwrite');
    transaction.objectStore(SESSION_STORE).delete(ACTIVE_KEY);
    transaction.objectStore(CHECKPOINT_STORE).delete(ACTIVE_KEY);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export function readLegacySessionJson(storage: Pick<Storage, 'getItem'>) {
  try {
    return storage.getItem(LEGACY_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export class BreakoutCheckpointQueue {
  private pending: Promise<void> = Promise.resolve();

  enqueue(write: () => Promise<void>) {
    this.pending = this.pending.then(write, write);
    return this.pending;
  }
}
