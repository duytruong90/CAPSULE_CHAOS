import {
  canonicalStringify,
  createCommitment,
  createGameLockPayload,
} from '../../game/engine/commitment';
import { parseEntries } from '../../game/engine/entryValidation';
import { createGameConfig } from '../../game/state/gameConfig';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';

const seed = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const roster = parseEntries('Đặng Trần\n夜桜\nPlayer🎮');
const config = createGameConfig(DEFAULT_SETUP_CONFIG);

describe('canonical game lock commitment', () => {
  it('sorts object keys while retaining array order', () => {
    expect(canonicalStringify({ zebra: 1, alpha: { two: 2, one: 1 }, list: ['b', 'a'] })).toBe(
      '{"alpha":{"one":1,"two":2},"list":["b","a"],"zebra":1}',
    );
  });

  it('matches a fixed SHA-256 commitment vector', async () => {
    const commitment = await createCommitment(createGameLockPayload(roster, config, seed));

    expect(commitment.fullHash).toBe(
      'c1b474f75200733f3915f10af6904016c72a31e3787df9ea91a37ca735d8cc8b',
    );
    expect(commitment.displayHash).toMatch(/^[0-9A-F]{4}(?:-[0-9A-F]{4}){3}$/u);
  });

  it('is identical for identical Unicode payloads across repeated runs', async () => {
    const payload = createGameLockPayload(roster, config, seed);
    const first = await createCommitment(payload);
    const second = await createCommitment(payload);

    expect(second).toEqual(first);
    expect(JSON.parse(first.canonicalPayload)).toEqual(payload);
  });

  it.each([
    {
      name: 'seed',
      payload: createGameLockPayload(roster, config, 'f'.repeat(64)),
    },
    {
      name: 'entry order',
      payload: createGameLockPayload(parseEntries('Player🎮\n夜桜\nĐặng Trần'), config, seed),
    },
    {
      name: 'configuration',
      payload: createGameLockPayload(roster, { ...config, fakeoutIntensity: 'high' }, seed),
    },
  ])('changes when the $name changes', async ({ payload }) => {
    const baseline = await createCommitment(createGameLockPayload(roster, config, seed));
    const changed = await createCommitment(payload);

    expect(changed.fullHash).not.toBe(baseline.fullHash);
  });
});
