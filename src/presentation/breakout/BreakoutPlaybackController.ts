import type { AnimationSpeed } from '../../game/state/setupTypes';
import type {
  BreakoutTimeline,
  BreakoutTimelineEvent,
} from '../../game/breakout/buildBreakoutTimeline';

export interface BreakoutPlaybackCheckpoint {
  readonly eventIndex: number;
  readonly elapsedBaseMs: number;
  readonly paused: boolean;
}

export interface BreakoutPlaybackState extends BreakoutPlaybackCheckpoint {
  readonly atManualBoundary: boolean;
  readonly complete: boolean;
}

const SPEED_MULTIPLIERS: Readonly<Record<AnimationSpeed, number>> = Object.freeze({
  fast: 0.6,
  normal: 1,
  cinematic: 1.5,
});

export class BreakoutPlaybackController {
  private readonly timeline: BreakoutTimeline;
  private readonly autoAdvanceActs: boolean;
  private readonly speedMultiplier: number;
  private eventIndex: number;
  private elapsedBaseMs: number;
  private paused: boolean;
  private atManualBoundary = false;
  private complete = false;
  private lastWallTimeMs: number | null = null;

  constructor(
    timeline: BreakoutTimeline,
    options: {
      animationSpeed: AnimationSpeed;
      autoAdvanceActs: boolean;
      checkpoint?: BreakoutPlaybackCheckpoint;
    },
  ) {
    if (timeline.events.length === 0)
      throw new Error('Playback requires at least one timeline event.');
    this.timeline = timeline;
    this.autoAdvanceActs = options.autoAdvanceActs;
    this.speedMultiplier = SPEED_MULTIPLIERS[options.animationSpeed];
    this.eventIndex = options.checkpoint?.eventIndex ?? 0;
    this.elapsedBaseMs = options.checkpoint?.elapsedBaseMs ?? 0;
    this.paused = options.checkpoint?.paused ?? false;
    if (
      this.eventIndex < 0 ||
      this.eventIndex >= timeline.events.length ||
      this.elapsedBaseMs < 0
    ) {
      throw new RangeError('Playback checkpoint is outside the timeline.');
    }
  }

  get currentEvent(): BreakoutTimelineEvent {
    return this.timeline.events[this.eventIndex] as BreakoutTimelineEvent;
  }

  get state(): BreakoutPlaybackState {
    return Object.freeze({
      eventIndex: this.eventIndex,
      elapsedBaseMs: this.elapsedBaseMs,
      paused: this.paused,
      atManualBoundary: this.atManualBoundary,
      complete: this.complete,
    });
  }

  get currentSnapshot() {
    const event = this.currentEvent;
    return event.resolutionBaseMs !== null && this.elapsedBaseMs >= event.resolutionBaseMs
      ? event.after
      : event.before;
  }

  tick(wallTimeMs: number) {
    if (!Number.isFinite(wallTimeMs)) throw new TypeError('Playback time must be finite.');
    if (this.lastWallTimeMs === null) {
      this.lastWallTimeMs = wallTimeMs;
      return this.state;
    }
    const wallDelta = Math.max(0, wallTimeMs - this.lastWallTimeMs);
    this.lastWallTimeMs = wallTimeMs;
    if (this.paused || this.atManualBoundary || this.complete) return this.state;

    this.elapsedBaseMs += wallDelta / this.speedMultiplier;
    while (this.elapsedBaseMs >= this.currentEvent.durationBaseMs && !this.complete) {
      const overflow = this.elapsedBaseMs - this.currentEvent.durationBaseMs;
      if (this.currentEvent.type === 'act.completed' && !this.autoAdvanceActs) {
        this.elapsedBaseMs = this.currentEvent.durationBaseMs;
        this.atManualBoundary = true;
        this.paused = true;
        break;
      }
      if (!this.advanceEvent()) break;
      this.elapsedBaseMs = overflow;
    }
    return this.state;
  }

  pause() {
    this.paused = true;
    this.lastWallTimeMs = null;
    return this.state;
  }

  resume() {
    if (!this.atManualBoundary && !this.complete) this.paused = false;
    this.lastWallTimeMs = null;
    return this.state;
  }

  skip() {
    if (this.atManualBoundary || this.complete) return this.state;
    const event = this.currentEvent;
    const settled = event.resolutionBaseMs === null || this.elapsedBaseMs >= event.resolutionBaseMs;
    if (!settled && event.resolutionBaseMs !== null) {
      this.elapsedBaseMs = Math.max(event.resolutionBaseMs, event.durationBaseMs - 800);
      return this.state;
    }
    this.advanceEvent();
    return this.state;
  }

  nextAct() {
    if (!this.atManualBoundary) return this.state;
    this.atManualBoundary = false;
    this.paused = false;
    this.advanceEvent();
    return this.state;
  }

  private advanceEvent() {
    if (this.eventIndex >= this.timeline.events.length - 1) {
      this.elapsedBaseMs = this.currentEvent.durationBaseMs;
      this.complete = true;
      this.paused = true;
      return false;
    }
    this.eventIndex += 1;
    this.elapsedBaseMs = 0;
    this.lastWallTimeMs = null;
    return true;
  }
}
