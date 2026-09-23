import { audioManager } from '../../audio/AudioManager';
import type {
  BreakoutTimeline,
  BreakoutTimelineEvent,
} from '../../game/breakout/buildBreakoutTimeline';
import type { AnimationSpeed } from '../../game/state/setupTypes';
import type { BreakoutCue } from './cueSheet';

export interface BreakoutPlaybackCheckpoint {
  readonly eventIndex: number;
  readonly elapsedBaseMs: number;
  readonly paused: boolean;
  readonly atManualBoundary?: boolean;
  readonly complete?: boolean;
  readonly checkpointRevision?: number;
}

export interface BreakoutPlaybackState {
  readonly eventIndex: number;
  readonly elapsedBaseMs: number;
  readonly paused: boolean;
  readonly atManualBoundary: boolean;
  readonly complete: boolean;
  readonly checkpointRevision: number;
}

const SPEED_MULTIPLIERS: Readonly<Record<AnimationSpeed, number>> = Object.freeze({
  fast: 0.6,
  normal: 1,
  cinematic: 1.5,
});

export function estimateBreakoutRuntimeMs(
  timeline: BreakoutTimeline,
  animationSpeed: AnimationSpeed,
) {
  return (
    timeline.events.reduce((total, event) => total + event.durationBaseMs, 0) *
    SPEED_MULTIPLIERS[animationSpeed]
  );
}

export class BreakoutPlaybackController {
  private readonly timeline: BreakoutTimeline;
  private readonly autoAdvanceActs: boolean;
  private readonly speedMultiplier: number;
  private readonly listeners = new Set<() => void>();
  private readonly cueSink: ((eventId: string, cue: BreakoutCue) => void) | undefined;
  private readonly cued = new Set<string>();
  private snapshot: BreakoutPlaybackState;
  private lastWallTimeMs: number | null = null;
  private frame: number | null = null;

  constructor(
    timeline: BreakoutTimeline,
    options: {
      animationSpeed: AnimationSpeed;
      autoAdvanceActs: boolean;
      checkpoint?: BreakoutPlaybackCheckpoint;
      cueSink?: (eventId: string, cue: BreakoutCue) => void;
    },
  ) {
    if (timeline.events.length === 0) throw new Error('Playback requires at least one event.');
    this.timeline = timeline;
    this.autoAdvanceActs = options.autoAdvanceActs;
    this.speedMultiplier = SPEED_MULTIPLIERS[options.animationSpeed];
    this.cueSink = options.cueSink;
    this.snapshot = Object.freeze({
      eventIndex: options.checkpoint?.eventIndex ?? 0,
      elapsedBaseMs: options.checkpoint?.elapsedBaseMs ?? 0,
      paused: options.checkpoint ? true : false,
      atManualBoundary: options.checkpoint?.atManualBoundary ?? false,
      complete: options.checkpoint?.complete ?? false,
      checkpointRevision: options.checkpoint?.checkpointRevision ?? 0,
    });
    if (
      this.snapshot.eventIndex < 0 ||
      this.snapshot.eventIndex >= timeline.events.length ||
      this.snapshot.elapsedBaseMs < 0 ||
      this.snapshot.elapsedBaseMs > this.currentEvent.durationBaseMs
    ) {
      throw new RangeError('Playback checkpoint is outside the timeline.');
    }
    if (options.checkpoint) {
      this.currentEvent.cues.forEach((cue) => {
        if (cue.offsetBaseMs <= this.snapshot.elapsedBaseMs && cue.bus === 'transient') {
          this.cued.add(this.cueKey(this.currentEvent, cue));
        }
      });
    }
  }

  get currentEvent(): BreakoutTimelineEvent {
    return this.timeline.events[this.snapshot.eventIndex] as BreakoutTimelineEvent;
  }

  get state() {
    return this.snapshot;
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  get currentSnapshot() {
    const event = this.currentEvent;
    return event.resolutionBaseMs !== null && this.snapshot.elapsedBaseMs >= event.resolutionBaseMs
      ? event.after
      : event.before;
  }

  connect = () => {
    if (this.frame !== null) return () => this.disconnect();
    const loop = (wallTimeMs: number) => {
      this.tick(wallTimeMs);
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
    return () => this.disconnect();
  };

  private disconnect() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.lastWallTimeMs = null;
    audioManager.stopAll();
  }

  private update(patch: Partial<BreakoutPlaybackState>, requestCheckpoint = false) {
    this.snapshot = Object.freeze({
      ...this.snapshot,
      ...patch,
      checkpointRevision: requestCheckpoint
        ? this.snapshot.checkpointRevision + 1
        : this.snapshot.checkpointRevision,
    });
    this.listeners.forEach((listener) => listener());
    return this.snapshot;
  }

  private cueKey(event: BreakoutTimelineEvent, cue: BreakoutCue) {
    return `${event.id}:${cue.cueId}:${cue.offsetBaseMs}`;
  }

  private deliverCues(fromBaseMs: number, toBaseMs: number) {
    this.currentEvent.cues.forEach((cue) => {
      const key = this.cueKey(this.currentEvent, cue);
      if (!this.cued.has(key) && cue.offsetBaseMs > fromBaseMs && cue.offsetBaseMs <= toBaseMs) {
        this.cued.add(key);
        this.cueSink?.(this.currentEvent.id, cue);
      }
    });
  }

  tick(wallTimeMs: number) {
    if (!Number.isFinite(wallTimeMs)) throw new TypeError('Playback time must be finite.');
    if (this.lastWallTimeMs === null) {
      this.lastWallTimeMs = wallTimeMs;
      if (!this.snapshot.paused) this.deliverCues(-1, this.snapshot.elapsedBaseMs);
      return this.snapshot;
    }
    const wallDelta = Math.max(0, wallTimeMs - this.lastWallTimeMs);
    this.lastWallTimeMs = wallTimeMs;
    if (this.snapshot.paused || this.snapshot.atManualBoundary || this.snapshot.complete) {
      return this.snapshot;
    }

    let elapsedBaseMs = this.snapshot.elapsedBaseMs + wallDelta / this.speedMultiplier;
    this.deliverCues(this.snapshot.elapsedBaseMs, elapsedBaseMs);
    this.update({ elapsedBaseMs });
    while (elapsedBaseMs >= this.currentEvent.durationBaseMs && !this.snapshot.complete) {
      const overflow = elapsedBaseMs - this.currentEvent.durationBaseMs;
      if (this.currentEvent.type === 'winner.declared') {
        this.update(
          {
            elapsedBaseMs: this.currentEvent.durationBaseMs,
            complete: true,
            paused: true,
          },
          true,
        );
        break;
      }
      if (this.currentEvent.type === 'act.completed' && !this.autoAdvanceActs) {
        this.update(
          {
            elapsedBaseMs: this.currentEvent.durationBaseMs,
            atManualBoundary: true,
            paused: true,
          },
          true,
        );
        break;
      }
      if (!this.advanceEvent()) break;
      elapsedBaseMs = overflow;
      this.update({ elapsedBaseMs });
      this.deliverCues(-1, elapsedBaseMs);
    }
    return this.snapshot;
  }

  pause() {
    audioManager.stopAll();
    this.lastWallTimeMs = null;
    return this.update({ paused: true }, true);
  }

  resume() {
    if (this.snapshot.atManualBoundary || this.snapshot.complete) return this.snapshot;
    this.lastWallTimeMs = null;
    return this.update({ paused: false }, true);
  }

  togglePause() {
    return this.snapshot.paused ? this.resume() : this.pause();
  }

  skip() {
    if (this.snapshot.atManualBoundary || this.snapshot.complete) return this.snapshot;
    audioManager.stopAll();
    const event = this.currentEvent;
    const settled =
      event.resolutionBaseMs === null || this.snapshot.elapsedBaseMs >= event.resolutionBaseMs;
    if (!settled) {
      const elapsedBaseMs = Math.max(event.resolutionBaseMs ?? 0, event.durationBaseMs - 800);
      this.deliverCues(this.snapshot.elapsedBaseMs, elapsedBaseMs);
      this.lastWallTimeMs = null;
      return this.update({ elapsedBaseMs }, true);
    }
    this.advanceEvent();
    return this.snapshot;
  }

  nextAct() {
    if (!this.snapshot.atManualBoundary) return this.snapshot;
    this.update({ atManualBoundary: false, paused: false }, true);
    this.advanceEvent();
    return this.snapshot;
  }

  private advanceEvent() {
    if (this.snapshot.eventIndex >= this.timeline.events.length - 1) {
      this.update(
        {
          elapsedBaseMs: this.currentEvent.durationBaseMs,
          complete: true,
          paused: true,
        },
        true,
      );
      return false;
    }
    this.lastWallTimeMs = null;
    this.update(
      {
        eventIndex: this.snapshot.eventIndex + 1,
        elapsedBaseMs: 0,
        atManualBoundary: false,
      },
      true,
    );
    return true;
  }
}
