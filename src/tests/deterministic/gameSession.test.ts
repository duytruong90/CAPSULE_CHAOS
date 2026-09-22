import { parseEntries } from '../../game/engine/entryValidation';
import { createLockedGameSession } from '../../game/state/gameSession';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';
import { serializeTimeline } from '../../game/timeline/buildTimeline';

const seed = 'abcdef0123456789'.repeat(4);
const roster = parseEntries(
  Array.from({ length: 30 }, (_, index) => `Locked Player ${index + 1}`).join('\n'),
);

describe('locked game session', () => {
  it('precomputes the commitment, complete simulation, and timeline from one seed', async () => {
    const session = await createLockedGameSession(roster, DEFAULT_SETUP_CONFIG, { seed });

    expect(session.publicLock.entryCount).toBe(30);
    expect(session.publicLock.commitment.fullHash).toHaveLength(64);
    expect(session.simulation.completed).toBe(true);
    expect(session.timeline.winnerId).toBe(session.simulation.winnerId);
    expect(session.timeline.events.at(-1)?.type).toBe('winner');
    expect(Object.isFrozen(session.lock.payload)).toBe(true);
    expect(Object.isFrozen(session.lock.payload.entries)).toBe(true);
    expect(Object.isFrozen(session.lock.payload.config)).toBe(true);
  });

  it('reproduces the entire locked outcome for the same roster, config, and seed', async () => {
    const first = await createLockedGameSession(roster, DEFAULT_SETUP_CONFIG, { seed });
    const second = await createLockedGameSession(roster, DEFAULT_SETUP_CONFIG, { seed });

    expect(second.publicLock.commitment).toEqual(first.publicLock.commitment);
    expect(second.simulation).toEqual(first.simulation);
    expect(serializeTimeline(second.timeline)).toBe(serializeTimeline(first.timeline));
  });

  it('does not expose the private seed through the public lock projection', async () => {
    const session = await createLockedGameSession(roster, DEFAULT_SETUP_CONFIG, { seed });

    expect(JSON.stringify(session.publicLock)).not.toContain(seed);
    expect('seed' in session.publicLock).toBe(false);
  });
});
