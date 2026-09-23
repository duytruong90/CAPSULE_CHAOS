import { createCommitment, type GameLockPayload, type LockedEntry } from '../engine/commitment';
import { simulateGame } from '../engine/simulateGame';
import type { LockedGameSession } from '../state/gameSession';
import type { EngineEvent } from '../state/gameTypes';
import { buildTimeline, serializeTimeline } from '../timeline/buildTimeline';
import type { GameTimeline, TimelineEvent } from '../timeline/eventTypes';

export const AUDIT_SCHEMA_VERSION = 'capsule-chaos-audit-v1' as const;

export interface AuditSummary {
  eliminations: readonly TimelineEvent[];
  revivals: readonly TimelineEvent[];
  cards: readonly TimelineEvent[];
  phaseTransitions: readonly TimelineEvent[];
}

export interface AuditDocument {
  schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  createdAt: string;
  giveawayName: string;
  lockPayload: GameLockPayload;
  commitmentHash: string;
  engineEvents: readonly EngineEvent[];
  timeline: GameTimeline;
  summary: AuditSummary;
  officialWinnerId: string;
  officialWinner: LockedEntry;
}

export interface AuditVerification {
  verified: boolean;
  commitmentValid: boolean;
  winnerValid: boolean;
  replayValid: boolean;
  errors: readonly string[];
}

export function createAuditDocument(
  session: LockedGameSession,
  giveawayName: string,
  createdAt = new Date(),
): AuditDocument {
  const officialWinner = session.lock.payload.entries.find(
    (entry) => entry.id === session.simulation.winnerId,
  );
  if (!officialWinner) throw new Error('The official winner is missing from the locked roster.');

  const events = session.timeline.events;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    createdAt: createdAt.toISOString(),
    giveawayName,
    lockPayload: session.lock.payload,
    commitmentHash: session.lock.commitment.fullHash,
    engineEvents: session.simulation.events,
    timeline: session.timeline,
    summary: {
      eliminations: events.filter((event) => event.type === 'elimination'),
      revivals: events.filter((event) => event.type === 'revival'),
      cards: events.filter((event) => event.type === 'card-reveal'),
      phaseTransitions: events.filter((event) => event.type === 'phase-transition'),
    },
    officialWinnerId: session.simulation.winnerId,
    officialWinner,
  };
}

export async function verifyAuditDocument(audit: AuditDocument): Promise<AuditVerification> {
  const errors: string[] = [];
  let commitmentValid = false;
  let replayValid = false;

  try {
    const commitment = await createCommitment(audit.lockPayload);
    commitmentValid = commitment.fullHash === audit.commitmentHash;
    if (!commitmentValid) errors.push('The commitment does not match the locked payload.');
  } catch {
    errors.push('The commitment could not be recomputed.');
  }

  const winnerEvents = audit.timeline.events.filter((event) => event.type === 'winner');
  const winnerValid =
    winnerEvents.length === 1 &&
    winnerEvents[0]?.payload.winnerId === audit.officialWinnerId &&
    audit.timeline.winnerId === audit.officialWinnerId &&
    audit.officialWinner.id === audit.officialWinnerId;
  if (!winnerValid) errors.push('The recorded official winner is inconsistent.');

  try {
    const roster = audit.lockPayload.entries.map((entry) => ({
      ...entry,
      sourceLineNumber: entry.entryIndex + 1,
    }));
    const simulation = simulateGame({
      roster,
      config: audit.lockPayload.config,
      seed: audit.lockPayload.seed,
    });
    const replay = buildTimeline(simulation);
    replayValid =
      simulation.winnerId === audit.officialWinnerId &&
      serializeTimeline(replay) === serializeTimeline(audit.timeline);
    if (!replayValid) errors.push('A deterministic replay does not match the recorded timeline.');
  } catch {
    errors.push('The deterministic replay could not be completed.');
  }

  return {
    verified: commitmentValid && winnerValid && replayValid,
    commitmentValid,
    winnerValid,
    replayValid,
    errors,
  };
}

export function serializeAuditDocument(audit: AuditDocument) {
  return `${JSON.stringify(audit, null, 2)}\n`;
}

export function createAuditFilename(audit: AuditDocument) {
  const timestamp = audit.createdAt.replace(/[:.]/gu, '-');
  return `capsule-chaos-audit-${timestamp}.json`;
}
