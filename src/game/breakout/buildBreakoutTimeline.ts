import { canonicalStringify } from '../engine/commitment';
import { FAULTLINE_NAMES_PER_PAGE, FAULTLINE_PAGE_DURATION_MS } from './config';
import {
  BREAKOUT_ENGINE_RULES_VERSION,
  BREAKOUT_TIMELINE_SCHEMA_VERSION,
  type BreakoutEngineEvent,
  type BreakoutSnapshot,
} from './types';
import {
  buildEscapeRunCueSheet,
  buildFinalClashCueSheet,
  buildFaultlineCueSheet,
  type BreakoutCue,
} from '../../presentation/breakout/cueSheet';

export interface BreakoutTimelineEvent {
  readonly id: string;
  readonly sequence: number;
  readonly type: BreakoutEngineEvent['type'];
  readonly engineEvent: BreakoutEngineEvent;
  readonly durationBaseMs: number;
  readonly resolutionBaseMs: number | null;
  readonly segments: Readonly<Record<string, number>>;
  readonly cues: readonly BreakoutCue[];
  readonly before: BreakoutSnapshot;
  readonly after: BreakoutSnapshot;
}

export interface BreakoutTimeline {
  readonly schemaVersion: typeof BREAKOUT_TIMELINE_SCHEMA_VERSION;
  readonly engineRulesVersion: typeof BREAKOUT_ENGINE_RULES_VERSION;
  readonly events: readonly BreakoutTimelineEvent[];
}

export function getFaultlineTiming(
  event: Extract<BreakoutEngineEvent, { type: 'faultline.wave-resolved' }>,
) {
  const maxSectorPageCount = Math.max(
    ...event.payload.wave.sectorsBefore.map((sector) =>
      Math.max(1, Math.ceil(sector.length / FAULTLINE_NAMES_PER_PAGE)),
    ),
  );
  const assignmentMs = Math.max(4_000, FAULTLINE_PAGE_DURATION_MS * maxSectorPageCount);
  const pageExtension = assignmentMs - 4_000;
  const shiftDuration = event.payload.wave.rotationSteps === 0 ? 0 : 3_000;
  const assignmentEnd = 4_000 + pageExtension;
  const scanningEnd = 7_000 + pageExtension;
  const warningStart = scanningEnd;
  const shiftStart = 10_500 + pageExtension;
  const braceStart = shiftStart + shiftDuration;
  const collapseStart = 13_000 + pageExtension + shiftDuration;
  const resolution = 14_600 + pageExtension + shiftDuration;
  const resultEnd = 20_600 + pageExtension + shiftDuration;
  const duration = 22_600 + pageExtension + shiftDuration;

  return Object.freeze({
    assignmentEnd,
    scanningEnd,
    warningStart,
    shiftStart,
    braceStart,
    collapseStart,
    resolution,
    resultEnd,
    duration,
    maxSectorPageCount,
  });
}

export function getRaceBeatTiming(
  event: Extract<BreakoutEngineEvent, { type: 'race.beat-resolved' }>,
) {
  const movementDuration = event.payload.beat.raceComplete ? 8_000 : 5_000;
  const photoDuration = event.payload.beat.cutoffTieIds.length > 0 ? 4_000 : 0;
  const movementReveal = 2_000;
  const movementStart = 2_800;
  const motionEnd = movementStart + movementDuration;
  const photoReveal = motionEnd + (photoDuration === 0 ? 0 : 2_000);
  const resolution = motionEnd + photoDuration;
  const resultEnd = resolution + 4_500;
  const duration = resolution + 5_000;

  return Object.freeze({
    movementReveal,
    movementStart,
    movementDuration,
    motionEnd,
    photoReveal,
    resolution,
    resultEnd,
    duration,
  });
}

export function getClashExchangeTiming(
  event: Extract<BreakoutEngineEvent, { type: 'clash.exchange-resolved' | 'winner.declared' }>,
) {
  if (event.type === 'winner.declared' && event.payload.decisiveExchange === null) {
    return Object.freeze({
      final: true,
      extraHold: 0,
      charge: 0,
      reveal: 0,
      flip: 0,
      interaction: 0,
      pointTravel: 0,
      resolution: 0,
      duration: 8_000,
    });
  }
  const exchanges =
    event.type === 'winner.declared' ? [event.payload.decisiveExchange] : event.payload.exchanges;
  const exchange = exchanges[0];
  if (!exchange) throw new Error('Clash timeline event requires an exchange.');
  const final = exchange.matchId === 'final';
  if (!final) {
    return Object.freeze({
      final,
      extraHold: 0,
      charge: 2_000,
      reveal: 4_000,
      flip: 4_800,
      interaction: 5_400,
      pointTravel: 7_000,
      resolution: 7_600,
      duration: 12_000,
    });
  }
  const bothScoresAre2 = exchange.scoreBefore[0] === 2 && exchange.scoreBefore[1] === 2;
  const eitherScoreIs2 = exchange.scoreBefore[0] === 2 || exchange.scoreBefore[1] === 2;
  const extraHold = bothScoresAre2 ? 4_000 : eitherScoreIs2 ? 2_000 : 0;
  const resolution = 9_000 + extraHold;
  return Object.freeze({
    final,
    extraHold,
    charge: 2_400,
    reveal: 4_800 + extraHold,
    flip: 5_600 + extraHold,
    interaction: 6_400 + extraHold,
    pointTravel: 8_400 + extraHold,
    resolution,
    duration: resolution + (event.type === 'winner.declared' ? 10_000 : 5_000),
  });
}

export function buildBreakoutTimeline(events: readonly BreakoutEngineEvent[]): BreakoutTimeline {
  const timelineEvents = events.flatMap((engineEvent): BreakoutTimelineEvent[] => {
    let durationBaseMs: number;
    let resolutionBaseMs: number | null = null;
    let segments: Readonly<Record<string, number>>;
    let cues: readonly BreakoutCue[] = Object.freeze([]);

    switch (engineEvent.type) {
      case 'show.locked':
        durationBaseMs = 8_000;
        segments = Object.freeze({ lock: 0, complete: 8_000 });
        break;
      case 'act.started':
        if (engineEvent.payload.actId === 'act-3') {
          if (engineEvent.payload.inputIds.length === 1) return [];
          durationBaseMs = 2_000;
          segments = Object.freeze({ title: 0, complete: 2_000 });
        } else if (engineEvent.payload.actId === 'act-2') {
          durationBaseMs = 10_000;
          segments = Object.freeze({
            conduitReveal: 0,
            rules: 2_500,
            startingGrid: 6_000,
            complete: 10_000,
          });
        } else {
          durationBaseMs = 8_000;
          segments = Object.freeze({
            roomReveal: 0,
            rules: 2_500,
            capsuleSpill: 5_000,
            complete: 8_000,
          });
        }
        break;
      case 'act.skipped':
        return [];
      case 'faultline.wave-resolved': {
        const timing = getFaultlineTiming(engineEvent);
        durationBaseMs = timing.duration;
        resolutionBaseMs = timing.resolution;
        segments = Object.freeze({ ...timing });
        cues = buildFaultlineCueSheet({
          assignmentEnd: timing.assignmentEnd,
          warningStart: timing.warningStart,
          shiftStart: timing.shiftStart,
          braceStart: timing.braceStart,
          collapseStart: timing.collapseStart,
          resolution: timing.resolution,
          hasConveyor: engineEvent.payload.wave.rotationSteps !== 0,
        });
        break;
      }
      case 'race.beat-resolved': {
        const timing = getRaceBeatTiming(engineEvent);
        durationBaseMs = timing.duration;
        resolutionBaseMs = timing.resolution;
        segments = Object.freeze({ ...timing });
        cues = buildEscapeRunCueSheet({
          movementReveal: timing.movementReveal,
          movementStart: timing.movementStart,
          motionEnd: timing.motionEnd,
          resolution: timing.resolution,
          hasCutoffTie: engineEvent.payload.beat.cutoffTieIds.length > 0,
          hasQualifications: engineEvent.payload.beat.newlyQualified.length > 0,
        });
        break;
      }
      case 'act.completed':
        if (engineEvent.payload.actId === 'act-2') {
          durationBaseMs = 7_000;
          segments = Object.freeze({ gatesLock: 0, lineup: 2_000, complete: 7_000 });
        } else {
          durationBaseMs = 6_000;
          segments = Object.freeze({ lineup: 0, objective: 3_000, complete: 6_000 });
        }
        break;
      case 'clash.bracket-ready':
        durationBaseMs = 8_000;
        segments = Object.freeze({
          bracket: 0,
          relationships: 2_500,
          target: 5_000,
          complete: 8_000,
        });
        break;
      case 'clash.final-ready':
        durationBaseMs = 8_000;
        segments = Object.freeze({ finalists: 0, merge: 3_000, target: 6_000, complete: 8_000 });
        break;
      case 'clash.exchange-resolved': {
        const timing = getClashExchangeTiming(engineEvent);
        durationBaseMs = timing.duration;
        resolutionBaseMs = timing.resolution;
        segments = Object.freeze({
          extraHold: timing.extraHold,
          charge: timing.charge,
          reveal: timing.reveal,
          flip: timing.flip,
          interaction: timing.interaction,
          pointTravel: timing.pointTravel,
          resolution: timing.resolution,
          duration: timing.duration,
        });
        cues = buildFinalClashCueSheet({
          charge: timing.charge,
          flip: timing.flip,
          interaction: timing.interaction,
          resolution: timing.resolution,
          final: timing.final,
          winner: false,
          exchanges: engineEvent.payload.exchanges,
        });
        break;
      }
      case 'winner.declared': {
        const timing = getClashExchangeTiming(engineEvent);
        durationBaseMs = timing.duration;
        resolutionBaseMs = timing.resolution;
        segments = Object.freeze({
          extraHold: timing.extraHold,
          charge: timing.charge,
          reveal: timing.reveal,
          flip: timing.flip,
          interaction: timing.interaction,
          pointTravel: timing.pointTravel,
          resolution: timing.resolution,
          duration: timing.duration,
          controls: timing.resolution + 5_000,
        });
        cues =
          engineEvent.payload.decisiveExchange === null
            ? Object.freeze([{ cueId: 'clash.winner', offsetBaseMs: 0, bus: 'fanfare' } as const])
            : buildFinalClashCueSheet({
                charge: timing.charge,
                flip: timing.flip,
                interaction: timing.interaction,
                resolution: timing.resolution,
                final: true,
                winner: true,
                exchanges: [engineEvent.payload.decisiveExchange],
              });
        break;
      }
      default:
        throw new Error('Breakout timeline received an unsupported event.');
    }

    return [
      Object.freeze({
        id: `breakout-timeline-${String(engineEvent.sequence + 1).padStart(4, '0')}`,
        sequence: engineEvent.sequence,
        type: engineEvent.type,
        engineEvent,
        durationBaseMs,
        resolutionBaseMs,
        segments,
        cues,
        before: engineEvent.before,
        after: engineEvent.after,
      }),
    ];
  });

  return Object.freeze({
    schemaVersion: BREAKOUT_TIMELINE_SCHEMA_VERSION,
    engineRulesVersion: BREAKOUT_ENGINE_RULES_VERSION,
    events: Object.freeze(timelineEvents),
  });
}

export const buildFaultlineTimeline = buildBreakoutTimeline;

export function serializeBreakoutTimeline(timeline: BreakoutTimeline) {
  return canonicalStringify(timeline);
}
