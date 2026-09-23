import {
  createAuditDocument,
  serializeAuditDocument,
  verifyAuditDocument,
  type AuditDocument,
} from '../../game/audit/audit';
import { parseEntries } from '../../game/engine/entryValidation';
import { createLockedGameSession } from '../../game/state/gameSession';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';

const seed = '90210abcdef12345'.repeat(4);
const roster = parseEntries(
  [
    'Nguyễn 🎮',
    '夜桜',
    'Player !!!',
    ...Array.from({ length: 27 }, (_, index) => `Player ${index}`),
  ].join('\n'),
);
const session = await createLockedGameSession(roster, DEFAULT_SETUP_CONFIG, { seed });

describe('versioned giveaway audit', () => {
  it('verifies the commitment, official winner, and exact deterministic replay', async () => {
    const audit = createAuditDocument(
      session,
      'Unicode giveaway',
      new Date('2026-09-22T12:00:00Z'),
    );
    await expect(verifyAuditDocument(audit)).resolves.toMatchObject({
      verified: true,
      commitmentValid: true,
      winnerValid: true,
      replayValid: true,
    });
    expect(audit.officialWinnerId).toBe(session.simulation.winnerId);
    expect(audit.summary.phaseTransitions.length).toBeGreaterThan(0);
    expect(audit.summary.eliminations.length).toBeGreaterThan(0);
  });

  it.each(['seed', 'config', 'entry'] as const)('rejects a tampered %s', async (kind) => {
    const audit = structuredClone(createAuditDocument(session, 'Tamper test'));
    if (kind === 'seed') audit.lockPayload = { ...audit.lockPayload, seed: 'f'.repeat(64) };
    if (kind === 'config')
      audit.lockPayload = {
        ...audit.lockPayload,
        config: {
          ...audit.lockPayload.config,
          soundEnabled: !audit.lockPayload.config.soundEnabled,
        },
      };
    if (kind === 'entry')
      audit.lockPayload = {
        ...audit.lockPayload,
        entries: audit.lockPayload.entries.map((entry, index) =>
          index === 0 ? { ...entry, displayName: 'Tampered' } : entry,
        ),
      };
    const result = await verifyAuditDocument(audit);
    expect(result.verified).toBe(false);
    expect(result.commitmentValid).toBe(false);
  });

  it('exports complete valid JSON and round-trips Unicode names', () => {
    const audit = createAuditDocument(session, '抽選会 🎉');
    const parsed = JSON.parse(serializeAuditDocument(audit)) as AuditDocument;
    expect(parsed.giveawayName).toBe('抽選会 🎉');
    expect(parsed.lockPayload.entries[0]!.displayName).toBe('Nguyễn 🎮');
    expect(parsed.timeline.winnerId).toBe(audit.officialWinnerId);
    expect(parsed.lockPayload.rngAlgorithm).toBeTruthy();
  });

  it('never treats theatrical fake-winner events as the official result', () => {
    const audit = createAuditDocument(session, 'Fake-out distinction');
    const fake = audit.timeline.events.find((event) => event.type === 'fake-winner');
    if (fake) expect(fake.type).not.toBe('winner');
    expect(audit.officialWinnerId).toBe(audit.timeline.events.at(-1)?.participants[0]);
  });
});
