import {
  deriveBreakoutRandomSeed,
  deriveBreakoutRandomSeeds,
} from '../../game/breakout/randomStreams';
import { BREAKOUT_ENGINE_RULES_VERSION } from '../../game/breakout/types';

const masterSeed = 'A1'.repeat(32);

describe('Breakout random streams', () => {
  it('derives all eight stable, distinct, lower-case 256-bit seeds', async () => {
    const first = await deriveBreakoutRandomSeeds(masterSeed);
    const second = await deriveBreakoutRandomSeeds(masterSeed.toLowerCase());

    expect(first).toEqual(second);
    expect(Object.keys(first)).toHaveLength(8);
    expect(new Set(Object.values(first))).toHaveLength(8);
    Object.values(first).forEach((value) => expect(value).toMatch(/^[0-9a-f]{64}$/u));
  });

  it('hashes actual null bytes in the documented namespace string', async () => {
    const expectedBytes = new TextEncoder().encode(
      `${BREAKOUT_ENGINE_RULES_VERSION}\0${masterSeed.toLowerCase()}\0floor`,
    );
    const digest = await crypto.subtle.digest('SHA-256', expectedBytes);
    const expected = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');

    expect(await deriveBreakoutRandomSeed(masterSeed, 'floor')).toBe(expected);
    expect(expectedBytes).toContain(0);
  });
});
