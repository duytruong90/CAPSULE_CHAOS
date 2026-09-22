import { canonicalStringify } from '../engine/commitment';
import type { EngineEvent, SimulationResult } from '../state/gameTypes';
import {
  TIMELINE_SCHEMA_VERSION,
  type GameTimeline,
  type TimelineEvent,
  type TimelineEventFor,
  type TimelineEventType,
  type TimelinePayloadByType,
} from './eventTypes';

export type TimelineDurationProfile = Readonly<Record<TimelineEventType, number>>;

export const DEFAULT_TIMELINE_DURATIONS: TimelineDurationProfile = Object.freeze({
  'capsule-spin': 1800,
  'player-reveal': 900,
  elimination: 1200,
  safe: 1100,
  'card-reveal': 1800,
  protection: 1200,
  revival: 1800,
  duel: 2200,
  'phase-transition': 1500,
  'fake-winner': 2200,
  'final-fate': 2200,
  winner: 6000,
});

export interface BuildTimelineOptions {
  durationOverrides?: Partial<TimelineDurationProfile>;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported engine event: ${JSON.stringify(value)}`);
}

export function buildTimeline(
  simulation: SimulationResult,
  options: BuildTimelineOptions = {},
): GameTimeline {
  const durations = { ...DEFAULT_TIMELINE_DURATIONS, ...options.durationOverrides };
  Object.entries(durations).forEach(([type, duration]) => {
    if (!Number.isFinite(duration) || duration < 0) {
      throw new RangeError(`Timeline duration for ${type} must be a non-negative finite number.`);
    }
  });

  const playerIds = simulation.players.map((player) => player.id);
  const knownPlayerIds = new Set(playerIds);
  const events: TimelineEvent[] = [];

  const append = <Type extends TimelineEventType>(
    source: EngineEvent,
    type: Type,
    participants: readonly string[],
    payload: TimelinePayloadByType[Type],
    presentationKey: string,
  ) => {
    participants.forEach((playerId) => {
      if (!knownPlayerIds.has(playerId)) {
        throw new Error(`Timeline references unknown player ${playerId}.`);
      }
    });
    const sequence = events.length;
    const event = Object.freeze({
      id: `timeline-${String(sequence + 1).padStart(4, '0')}`,
      sequence,
      phase: source.phase,
      type,
      participants: Object.freeze([...participants]),
      payload: Object.freeze({ ...payload }),
      presentationKey,
      minimumDurationMs: durations[type],
    }) as TimelineEventFor<Type>;
    events.push(event as TimelineEvent);
  };

  simulation.events.forEach((event) => {
    switch (event.type) {
      case 'phase-started':
        append(
          event,
          'phase-transition',
          event.participants,
          {
            sourceEngineEventId: event.id,
            status: 'started',
            activeCount: event.payload.activeCount,
            targetCount: event.payload.targetCount,
          },
          `phase.${event.phase}.start`,
        );
        break;
      case 'phase-completed':
        append(
          event,
          'phase-transition',
          event.participants,
          {
            sourceEngineEventId: event.id,
            status: 'complete',
            activeCount: event.payload.activeCount,
            targetCount: event.payload.targetCount,
          },
          `phase.${event.phase}.complete`,
        );
        break;
      case 'player-drawn':
        append(
          event,
          'capsule-spin',
          event.participants,
          {
            sourceEngineEventId: event.id,
            drawRule: event.payload.drawRule,
            marked: event.payload.marked,
          },
          'capsule.spin',
        );
        append(
          event,
          'player-reveal',
          event.participants,
          {
            sourceEngineEventId: event.id,
            drawRule: event.payload.drawRule,
            marked: event.payload.marked,
          },
          'capsule.player-reveal',
        );
        break;
      case 'card-resolved':
        append(
          event,
          'card-reveal',
          event.participants,
          { sourceEngineEventId: event.id, ...event.payload },
          event.payload.presentationKey,
        );
        break;
      case 'player-eliminated':
        append(
          event,
          'elimination',
          event.participants,
          {
            sourceEngineEventId: event.id,
            activeCount: event.payload.activeCount,
            eliminationCount: event.payload.eliminationCount,
          },
          'result.elimination',
        );
        break;
      case 'player-safe':
        append(
          event,
          'safe',
          event.participants,
          { sourceEngineEventId: event.id, activeCount: event.payload.activeCount },
          'result.safe',
        );
        break;
      case 'protection-consumed':
        append(
          event,
          'protection',
          event.participants,
          {
            sourceEngineEventId: event.id,
            protection: event.payload.protection,
            remainingCharges: event.payload.remainingCharges,
          },
          `protection.${event.payload.protection}`,
        );
        break;
      case 'player-revived':
        append(
          event,
          'revival',
          event.participants,
          {
            sourceEngineEventId: event.id,
            activeCount: event.payload.activeCount,
            revivalCount: event.payload.revivalCount,
          },
          'result.revival',
        );
        break;
      case 'winner-declared':
        append(
          event,
          'winner',
          event.participants,
          { sourceEngineEventId: event.id, winnerId: event.participants[0] as string },
          'result.official-winner',
        );
        break;
      default:
        assertNever(event);
    }
  });

  const winnerEvent = events.find((event) => event.type === 'winner');
  if (!winnerEvent || winnerEvent.payload.winnerId !== simulation.winnerId) {
    throw new Error('Timeline winner does not match the resolved engine winner.');
  }

  return Object.freeze({
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    engineRulesVersion: simulation.rulesVersion,
    winnerId: simulation.winnerId,
    playerIds: Object.freeze(playerIds),
    events: Object.freeze(events),
  });
}

export function serializeTimeline(timeline: GameTimeline) {
  return canonicalStringify(timeline);
}

export function extractTimelineOutcomes(timeline: GameTimeline) {
  return timeline.events.map(({ id, sequence, phase, type, participants, payload }) => ({
    id,
    sequence,
    phase,
    type,
    participants,
    payload,
  }));
}
