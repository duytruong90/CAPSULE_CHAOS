import type { PlaybackSnapshot } from '../../presentation/playbackController';
import type { LockedGameSession } from './gameSession';

export const SESSION_STORAGE_KEY = 'capsule-chaos.active-session.v1';
export const PERSISTED_SESSION_VERSION = 'capsule-chaos-session-v1' as const;

export interface PersistedGameSession {
  schemaVersion: typeof PERSISTED_SESSION_VERSION;
  savedAt: string;
  giveawayName: string;
  session: LockedGameSession;
  playback: PlaybackSnapshot;
}

function isPersistedSession(value: unknown): value is PersistedGameSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PersistedGameSession>;
  return (
    candidate.schemaVersion === PERSISTED_SESSION_VERSION &&
    typeof candidate.giveawayName === 'string' &&
    typeof candidate.savedAt === 'string' &&
    Boolean(candidate.session?.lock?.payload?.seed) &&
    Boolean(candidate.session?.timeline?.events) &&
    typeof candidate.playback?.index === 'number'
  );
}

export function savePersistedSession(
  storage: Pick<Storage, 'setItem'>,
  giveawayName: string,
  session: LockedGameSession,
  playback: PlaybackSnapshot,
) {
  try {
    const value: PersistedGameSession = {
      schemaVersion: PERSISTED_SESSION_VERSION,
      savedAt: new Date().toISOString(),
      giveawayName,
      session,
      playback,
    };
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadPersistedSession(
  storage: Pick<Storage, 'getItem'>,
): PersistedGameSession | null {
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPersistedSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPersistedSession(storage: Pick<Storage, 'removeItem'>) {
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
