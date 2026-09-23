import { parseEntries } from '../../game/engine/entryValidation';
import { createLockedGameSession } from '../../game/state/gameSession';
import {
  clearPersistedSession,
  loadPersistedSession,
  savePersistedSession,
} from '../../game/state/persistence';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';
import { PlaybackController } from '../../presentation/playbackController';

const seed = '1234abcd'.repeat(8);
const roster = parseEntries(
  Array.from({ length: 30 }, (_, index) => `玩家 Nguyễn ${index}`).join('\n'),
);
const session = await createLockedGameSession(roster, DEFAULT_SETUP_CONFIG, { seed });

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe('live session persistence', () => {
  it('round-trips the locked seed, timeline, playback position, winner, and Unicode roster', () => {
    const storage = memoryStorage();
    const playback = new PlaybackController(session.timeline, DEFAULT_SETUP_CONFIG, roster.length);
    playback.skip();
    expect(savePersistedSession(storage, '復旧 🎮', session, playback.getSnapshot())).toBe(true);
    const recovered = loadPersistedSession(storage)!;
    expect(recovered.giveawayName).toBe('復旧 🎮');
    expect(recovered.session.lock.payload.seed).toBe(seed);
    expect(recovered.session.timeline).toEqual(session.timeline);
    expect(recovered.session.timeline.winnerId).toBe(session.simulation.winnerId);
    expect(recovered.session.lock.payload.entries[0]?.displayName).toContain('玩家 Nguyễn');
  });

  it('fails safely when storage is unavailable', () => {
    const unavailable = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const playback = new PlaybackController(session.timeline, DEFAULT_SETUP_CONFIG, roster.length);
    expect(savePersistedSession(unavailable, 'Blocked', session, playback.getSnapshot())).toBe(
      false,
    );
    expect(loadPersistedSession(unavailable)).toBeNull();
    expect(clearPersistedSession(unavailable)).toBe(false);
  });
});
