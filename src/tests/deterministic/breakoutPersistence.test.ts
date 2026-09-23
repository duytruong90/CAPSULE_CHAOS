import {
  BREAKOUT_DATABASE_NAME,
  BREAKOUT_DATABASE_VERSION,
  BreakoutCheckpointQueue,
  BreakoutRecoveryValidationError,
  LEGACY_SESSION_STORAGE_KEY,
  openBreakoutDatabase,
  readLegacySessionJson,
  validateBreakoutRecoveryRecords,
} from '../../game/breakout/persistence';
import { BREAKOUT_SESSION_SCHEMA_VERSION } from '../../game/breakout/types';

describe('Breakout persistence', () => {
  it('uses the approved database identity and rejects cleanly without IndexedDB', async () => {
    expect(BREAKOUT_DATABASE_NAME).toBe('capsule-chaos-breakout');
    expect(BREAKOUT_DATABASE_VERSION).toBe(1);
    await expect(openBreakoutDatabase(undefined as never)).rejects.toThrow(
      'IndexedDB is unavailable.',
    );
  });

  it('detects the legacy session without modifying it', () => {
    const getItem = vi.fn(() => '{"legacy":true}');

    expect(readLegacySessionJson({ getItem })).toBe('{"legacy":true}');
    expect(getItem).toHaveBeenCalledWith(LEGACY_SESSION_STORAGE_KEY);
  });

  it('serializes queued checkpoint writes even after a failed write', async () => {
    const queue = new BreakoutCheckpointQueue();
    const order: string[] = [];
    const first = queue.enqueue(() => {
      order.push('first');
      return Promise.reject(new Error('storage unavailable'));
    });
    const second = queue.enqueue(() => {
      order.push('second');
      return Promise.resolve();
    });

    await expect(first).rejects.toThrow('storage unavailable');
    await expect(second).resolves.toBeUndefined();
    expect(order).toEqual(['first', 'second']);
  });

  it.each([
    ['unknown schema', 'old-schema', 'hash', 0, 'unsupported-rules-version'],
    [
      'commitment mismatch',
      BREAKOUT_SESSION_SCHEMA_VERSION,
      'different-hash',
      0,
      'checkpoint-commitment-mismatch',
    ],
    [
      'out-of-range checkpoint',
      BREAKOUT_SESSION_SCHEMA_VERSION,
      'hash',
      9,
      'malformed-breakout-checkpoint',
    ],
  ])('preserves saved bytes when rejecting an %s', (_label, schema, hash, eventIndex, error) => {
    const savedSession = {
      schemaVersion: schema,
      session: {
        lock: { commitment: { fullHash: 'hash' } },
        timeline: { events: [{ durationBaseMs: 100 }] },
      },
    };
    const savedCheckpoint = {
      schemaVersion: BREAKOUT_SESSION_SCHEMA_VERSION,
      commitmentHash: hash,
      checkpoint: { eventIndex, elapsedBaseMs: 50, paused: true },
    };

    try {
      validateBreakoutRecoveryRecords(savedSession, savedCheckpoint);
      throw new Error('Expected recovery validation to fail.');
    } catch (caught) {
      expect(caught).toBeInstanceOf(BreakoutRecoveryValidationError);
      expect(caught).toMatchObject({ message: error });
      expect((caught as BreakoutRecoveryValidationError).savedBytes).toContain('"savedCheckpoint"');
    }
  });
});
