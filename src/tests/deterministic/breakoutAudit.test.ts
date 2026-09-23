import {
  createBreakoutAuditDocument,
  createBreakoutAuditFilename,
  serializeBreakoutAuditDocument,
  verifyBreakoutAuditDocument,
  type BreakoutAuditDocument,
} from '../../game/breakout/audit';
import { createLockedBreakoutSession } from '../../game/breakout/session';
import { BREAKOUT_AUDIT_SCHEMA_VERSION } from '../../game/breakout/types';
import { parseEntries } from '../../game/engine/entryValidation';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';

const seed = 'ab'.repeat(32);
const roster = parseEntries(
  Array.from({ length: 32 }, (_, index) => `Auditor ${index + 1}`).join('\n'),
);

function clone(audit: BreakoutAuditDocument): unknown {
  return JSON.parse(JSON.stringify(audit)) as unknown;
}

describe('Breakout V4 audit', () => {
  it('exports a complete, self-verifying audit document', async () => {
    const session = await createLockedBreakoutSession(roster, DEFAULT_SETUP_CONFIG, { seed });
    const audit = createBreakoutAuditDocument(
      session,
      'Audit Night',
      new Date('2026-09-23T12:00:00.000Z'),
    );

    expect(audit.schemaVersion).toBe(BREAKOUT_AUDIT_SCHEMA_VERSION);
    expect(audit.simulation.events).toEqual(session.simulation.events);
    expect(audit.timeline).toEqual(session.timeline);
    expect(audit.summary.officialWinnerId).toBe(session.simulation.winnerId);
    expect(serializeBreakoutAuditDocument(audit).endsWith('\n')).toBe(true);
    expect(createBreakoutAuditFilename(audit)).toBe(
      'capsule-chaos-breakout-audit-2026-09-23T12-00-00-000Z.json',
    );
    await expect(verifyBreakoutAuditDocument(audit)).resolves.toMatchObject({
      verified: true,
      commitmentValid: true,
      replayValid: true,
      winnerValid: true,
    });
  });

  it.each([
    [
      'commitment',
      (copy: unknown) => {
        (copy as { commitmentHash: string }).commitmentHash = '0'.repeat(64);
      },
    ],
    [
      'derived stream',
      (copy: unknown) => {
        (copy as { randomSeeds: { bracket: string } }).randomSeeds.bracket = '1'.repeat(64);
      },
    ],
    [
      'engine event',
      (copy: unknown) => {
        (copy as { simulation: { events: { id: string }[] } }).simulation.events[2]!.id = 'changed';
      },
    ],
    [
      'timeline',
      (copy: unknown) => {
        (
          copy as { timeline: { events: { durationBaseMs: number }[] } }
        ).timeline.events[0]!.durationBaseMs += 2;
      },
    ],
    [
      'summary',
      (copy: unknown) => {
        (copy as { summary: { floorWaves: number } }).summary.floorWaves += 1;
      },
    ],
    [
      'winner',
      (copy: unknown) => {
        (copy as { officialWinner: { id: string } }).officialWinner.id = 'not-the-winner';
      },
    ],
  ])('rejects a tampered %s', async (_label, mutate) => {
    const session = await createLockedBreakoutSession(roster, DEFAULT_SETUP_CONFIG, { seed });
    const audit = createBreakoutAuditDocument(session, 'Audit Night');
    const changed = clone(audit);
    mutate(changed);

    await expect(
      verifyBreakoutAuditDocument(changed as BreakoutAuditDocument),
    ).resolves.toMatchObject({ verified: false });
  });

  it('rejects an unsupported audit schema without replaying it', async () => {
    const session = await createLockedBreakoutSession(roster, DEFAULT_SETUP_CONFIG, { seed });
    const changed = clone(createBreakoutAuditDocument(session, 'Audit Night'));
    (changed as { schemaVersion: string }).schemaVersion = 'capsule-chaos-audit-v1';

    await expect(
      verifyBreakoutAuditDocument(changed as BreakoutAuditDocument),
    ).resolves.toMatchObject({
      verified: false,
      errors: ['unsupported-rules-version'],
    });
  });
});
