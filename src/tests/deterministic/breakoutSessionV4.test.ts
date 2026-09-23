import { BREAKOUT_RULES } from '../../game/breakout/config';
import {
  createBreakoutLockPayload,
  createLockedBreakoutSession,
  verifyBreakoutSession,
} from '../../game/breakout/session';
import {
  BREAKOUT_ENGINE_RULES_VERSION,
  BREAKOUT_LOCK_SCHEMA_VERSION,
} from '../../game/breakout/types';
import { parseEntries } from '../../game/engine/entryValidation';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';

const seed = '0123456789abcdef'.repeat(4);
const roster = parseEntries(
  Array.from({ length: 24 }, (_, index) => `Player ${index + 1}`).join('\n'),
);

describe('Breakout V4 locked session', () => {
  it('commits the roster, cosmetic host config, fixed rules, and engine versions', () => {
    const payload = createBreakoutLockPayload(roster, DEFAULT_SETUP_CONFIG, seed);

    expect(payload.schemaVersion).toBe(BREAKOUT_LOCK_SCHEMA_VERSION);
    expect(payload.engineRulesVersion).toBe(BREAKOUT_ENGINE_RULES_VERSION);
    expect(payload.fixedRules).toEqual(BREAKOUT_RULES);
    expect(payload.entries).toHaveLength(24);
    expect(payload.config).not.toHaveProperty('fakeoutIntensity');
  });

  it('precomputes all three acts and verifies a deterministic replay', async () => {
    const first = await createLockedBreakoutSession(roster, DEFAULT_SETUP_CONFIG, { seed });
    const second = await createLockedBreakoutSession(roster, DEFAULT_SETUP_CONFIG, { seed });

    expect(second).toEqual(first);
    expect(first.simulation.faultline.waves.length).toBeGreaterThan(0);
    expect(first.simulation.escapeRun.beats.length).toBeGreaterThan(0);
    expect(first.simulation.bracket.finalMatch).not.toBeNull();
    expect(first.simulation.events.at(-1)?.type).toBe('winner.declared');
    await expect(verifyBreakoutSession(first)).resolves.toMatchObject({ verified: true });
  });

  it('rejects a changed event, random stream, or timeline', async () => {
    const session = await createLockedBreakoutSession(roster, DEFAULT_SETUP_CONFIG, { seed });

    for (const mutate of [
      (copy: unknown) => {
        (copy as { simulation: { events: { id: string }[] } }).simulation.events[1]!.id =
          'tampered-event';
      },
      (copy: unknown) => {
        (copy as { randomSeeds: { floor: string } }).randomSeeds.floor = 'f'.repeat(64);
      },
      (copy: unknown) => {
        (
          copy as { timeline: { events: { durationBaseMs: number }[] } }
        ).timeline.events[0]!.durationBaseMs += 1;
      },
    ]) {
      const copy = JSON.parse(JSON.stringify(session)) as unknown;
      mutate(copy);
      await expect(verifyBreakoutSession(copy as never)).resolves.toMatchObject({
        verified: false,
      });
    }
  });
});
