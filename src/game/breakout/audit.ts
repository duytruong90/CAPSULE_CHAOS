import { BREAKOUT_RANDOM_STREAM_LABELS } from './randomStreams';
import { canonicalStringify } from '../engine/commitment';
import {
  createBreakoutCommitment,
  verifyBreakoutSession,
  type BreakoutLockPayload,
  type LockedBreakoutSession,
} from './session';
import {
  BREAKOUT_AUDIT_SCHEMA_VERSION,
  type BreakoutEngineEvent,
  type BreakoutRandomSeeds,
  type BreakoutSimulationResult,
} from './types';
import type { BreakoutTimeline } from './buildBreakoutTimeline';

export interface BreakoutEliminationGroup {
  readonly sourceEventId: string;
  readonly eliminatedIds: readonly string[];
}

export interface BreakoutAuditSummary {
  readonly startingEntryCount: number;
  readonly floorWaves: number;
  readonly raceBeats: number;
  readonly raceQualifiers: readonly string[];
  readonly clashMatches: number;
  readonly eliminationGroups: readonly BreakoutEliminationGroup[];
  readonly officialWinnerId: string;
}

export interface BreakoutAuditDocument {
  readonly schemaVersion: typeof BREAKOUT_AUDIT_SCHEMA_VERSION;
  readonly createdAt: string;
  readonly giveawayName: string;
  readonly lockPayload: BreakoutLockPayload;
  readonly commitmentHash: string;
  readonly streamNamespaces: typeof BREAKOUT_RANDOM_STREAM_LABELS;
  readonly randomSeeds: BreakoutRandomSeeds;
  readonly simulation: BreakoutSimulationResult;
  readonly timeline: BreakoutTimeline;
  readonly summary: BreakoutAuditSummary;
  readonly officialWinner: BreakoutLockPayload['entries'][number];
}

export interface BreakoutAuditVerification {
  readonly verified: boolean;
  readonly commitmentValid: boolean;
  readonly replayValid: boolean;
  readonly winnerValid: boolean;
  readonly errors: readonly string[];
}

function eliminatedByEvent(event: BreakoutEngineEvent): readonly string[] {
  return event.after.eligibleIds.length < event.before.eligibleIds.length
    ? Object.freeze(event.before.eligibleIds.filter((id) => !event.after.eligibleIds.includes(id)))
    : Object.freeze([]);
}

export function createBreakoutAuditDocument(
  session: LockedBreakoutSession,
  giveawayName: string,
  createdAt = new Date(),
): BreakoutAuditDocument {
  const winner = session.lock.payload.entries.find(
    (entry) => entry.id === session.simulation.winnerId,
  );
  if (!winner) throw new Error('The official winner is missing from the locked roster.');
  const eliminationGroups = session.simulation.events.flatMap((event) => {
    const eliminatedIds = eliminatedByEvent(event);
    return eliminatedIds.length > 0
      ? [Object.freeze({ sourceEventId: event.id, eliminatedIds })]
      : [];
  });
  const clashMatches =
    session.simulation.bracket.semifinalMatches.length +
    (session.simulation.bracket.finalMatch ? 1 : 0);
  return Object.freeze({
    schemaVersion: BREAKOUT_AUDIT_SCHEMA_VERSION,
    createdAt: createdAt.toISOString(),
    giveawayName,
    lockPayload: session.lock.payload,
    commitmentHash: session.lock.commitment.fullHash,
    streamNamespaces: BREAKOUT_RANDOM_STREAM_LABELS,
    randomSeeds: session.randomSeeds,
    simulation: session.simulation,
    timeline: session.timeline,
    summary: Object.freeze({
      startingEntryCount: session.lock.payload.entries.length,
      floorWaves: session.simulation.faultline.waves.length,
      raceBeats: session.simulation.escapeRun.beats.length,
      raceQualifiers: session.simulation.qualifierIds,
      clashMatches,
      eliminationGroups: Object.freeze(eliminationGroups),
      officialWinnerId: session.simulation.winnerId,
    }),
    officialWinner: winner,
  });
}

export async function verifyBreakoutAuditDocument(
  audit: BreakoutAuditDocument,
): Promise<BreakoutAuditVerification> {
  if (audit.schemaVersion !== BREAKOUT_AUDIT_SCHEMA_VERSION) {
    return Object.freeze({
      verified: false,
      commitmentValid: false,
      replayValid: false,
      winnerValid: false,
      errors: Object.freeze(['unsupported-rules-version']),
    });
  }
  const session: LockedBreakoutSession = {
    lock: {
      payload: audit.lockPayload,
      commitment: {
        algorithm: 'SHA-256',
        fullHash: audit.commitmentHash,
        displayHash: '',
        canonicalPayload: '',
      },
    },
    publicLock: {
      schemaVersion: audit.lockPayload.schemaVersion,
      entryCount: audit.lockPayload.entries.length,
      commitment: { algorithm: 'SHA-256', fullHash: audit.commitmentHash, displayHash: '' },
    },
    randomSeeds: audit.randomSeeds,
    simulation: audit.simulation,
    timeline: audit.timeline,
  };
  let commitmentValid: boolean;
  try {
    const commitment = await createBreakoutCommitment(audit.lockPayload);
    commitmentValid = commitment.fullHash === audit.commitmentHash;
  } catch {
    commitmentValid = false;
  }
  const replay = await verifyBreakoutSession(session);
  const winnerEvents = audit.simulation.events.filter((event) => event.type === 'winner.declared');
  const winnerValid =
    winnerEvents.length === 1 &&
    winnerEvents[0]?.payload.winnerId === audit.summary.officialWinnerId &&
    audit.officialWinner.id === audit.summary.officialWinnerId &&
    audit.simulation.winnerId === audit.summary.officialWinnerId;
  const expectedAudit = createBreakoutAuditDocument(session, audit.giveawayName, new Date(0));
  const metadataValid =
    canonicalStringify(audit.streamNamespaces) ===
      canonicalStringify(BREAKOUT_RANDOM_STREAM_LABELS) &&
    canonicalStringify(audit.summary) === canonicalStringify(expectedAudit.summary) &&
    canonicalStringify(audit.officialWinner) === canonicalStringify(expectedAudit.officialWinner);
  const replayValid = replay.verified && metadataValid;
  const errors = [
    ...(commitmentValid ? [] : ['The commitment could not be recomputed.']),
    ...(replay.verified ? [] : [replay.error ?? 'session-replay-mismatch']),
    ...(metadataValid ? [] : ['The audit summary or stream namespaces are inconsistent.']),
    ...(winnerValid ? [] : ['The official winner is inconsistent.']),
  ];
  return Object.freeze({
    verified: commitmentValid && replayValid && winnerValid,
    commitmentValid,
    replayValid,
    winnerValid,
    errors: Object.freeze(errors),
  });
}

export function serializeBreakoutAuditDocument(audit: BreakoutAuditDocument) {
  return `${JSON.stringify(audit, null, 2)}\n`;
}

export function createBreakoutAuditFilename(audit: BreakoutAuditDocument) {
  return `capsule-chaos-breakout-audit-${audit.createdAt.replace(/[:.]/gu, '-')}.json`;
}
