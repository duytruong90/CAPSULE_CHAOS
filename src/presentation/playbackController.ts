import { audioManager, type AudioCue } from '../audio/AudioManager';
import type { SetupConfig } from '../game/state/setupTypes';
import type { GameTimeline, TimelineEvent } from '../game/timeline/eventTypes';
import {
  eventDuration,
  INTRO_DURATION,
  reactionDuration,
  SKIP_HOLD_DURATION,
  SPEED_MULTIPLIERS,
} from './animationDurations';

export interface PlaybackSnapshot {
  index: number;
  stage: 'intro' | 'event' | 'boundary' | 'complete';
  settled: boolean;
  paused: boolean;
  remaining: number;
  elapsedMs: number;
}

/** Presentation-only state machine. One clock; no engine, seed, or random calls. */
export class PlaybackController {
  private snapshot: PlaybackSnapshot;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private deadline = 0;
  private pendingMs = 0;
  private pending: (() => void) | undefined;
  private connected = false;
  private started = false;
  private cued = new Set<string>();

  constructor(
    readonly timeline: GameTimeline,
    readonly config: Readonly<SetupConfig>,
    readonly entryCount: number,
  ) {
    this.snapshot = {
      index: -1,
      stage: 'intro',
      settled: false,
      paused: false,
      remaining: entryCount,
      elapsedMs: 0,
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  get event() {
    return this.timeline.events[this.snapshot.index];
  }
  get duration() {
    return this.event
      ? eventDuration(this.event, this.config.animationSpeed, this.entryCount)
      : INTRO_DURATION * SPEED_MULTIPLIERS[this.config.animationSpeed];
  }

  private update(patch: Partial<PlaybackSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private clear() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.pending = undefined;
  }
  private schedule(ms: number, callback: () => void) {
    this.clear();
    this.pending = callback;
    this.pendingMs = ms;
    if (!this.connected) return;
    this.deadline = Date.now() + ms;
    this.timer = setTimeout(() => {
      this.pending = undefined;
      this.timer = undefined;
      callback();
    }, ms);
  }
  connect = () => {
    this.connected = true;
    if (!this.started) {
      this.started = true;
      this.schedule(this.duration, this.complete);
    } else if (this.pending) {
      this.schedule(this.pendingMs, this.pending);
    }
    return () => {
      this.connected = false;
      if (this.timer !== undefined) {
        this.pendingMs = Math.max(0, this.deadline - Date.now());
        clearTimeout(this.timer);
        this.timer = undefined;
        if (!this.snapshot.settled) this.update({ elapsedMs: this.duration - this.pendingMs });
      }
    };
  };
  private cue(event: TimelineEvent, end: boolean) {
    let cue: AudioCue | undefined;
    if (event.type === 'card-reveal')
      cue = `card.${event.payload.rarity}.${end ? 'impact' : 'charge'}`;
    else if (!end && event.type === 'capsule-spin') cue = 'capsule.spin';
    else if (!end && event.type === 'player-reveal') cue = 'capsule.open';
    else if (!end && ['elimination', 'safe', 'revival'].includes(event.type))
      cue = `result.${event.type}` as AudioCue;
    else if (!end && event.type === 'final-chamber') cue = 'final.heartbeat';
    else if (!end && event.type === 'fake-winner') cue = 'final.glitch';
    const key = `${event.id}:${end}`;
    if (cue && !this.cued.has(key)) {
      this.cued.add(key);
      audioManager.cue({ cue, eventId: event.id }, this.config.soundEnabled);
    }
  }
  /** Explicit completion API, shared by the clock and Skip. Idempotent per event. */
  complete = (skipped = false) => {
    if (
      this.snapshot.settled ||
      this.snapshot.stage === 'boundary' ||
      this.snapshot.stage === 'complete'
    )
      return;
    this.clear();
    const event = this.event;
    const remaining =
      event && 'activeCount' in event.payload ? event.payload.activeCount : this.snapshot.remaining;
    const boundary =
      event?.type === 'phase-transition' &&
      event.payload.status === 'complete' &&
      event.phase !== 'final';
    const complete = event?.type === 'winner';
    this.update({
      settled: true,
      remaining,
      stage: complete ? 'complete' : boundary ? 'boundary' : this.snapshot.stage,
    });
    if (event) this.cue(event, true);
    if (this.snapshot.paused || (boundary && !this.config.autoAdvancePhases)) return;
    this.schedule(
      skipped
        ? SKIP_HOLD_DURATION
        : event
          ? reactionDuration(event, this.config.animationSpeed)
          : 300,
      this.advance,
    );
  };
  private advance = () => {
    this.clear();
    if (this.snapshot.paused) return;
    const index = this.snapshot.index + 1;
    const event = this.timeline.events[index];
    // Later phase renderers ship in their own build steps. Never leak their results here.
    if (!event) {
      this.update({ stage: 'complete', settled: true });
      return;
    }
    this.update({ index, stage: 'event', settled: false, elapsedMs: 0 });
    this.cue(event, false);
    this.schedule(this.duration, this.complete);
  };
  togglePause = () => {
    if (this.snapshot.stage === 'complete') return;
    const paused = !this.snapshot.paused;
    this.update({ paused });
    // Pause lets the current animation finish, then holds its resolved state.
    if (paused && this.snapshot.settled) this.clear();
    if (
      !paused &&
      this.snapshot.settled &&
      (this.snapshot.stage !== 'boundary' || this.config.autoAdvancePhases)
    ) {
      this.schedule(SKIP_HOLD_DURATION, this.advance);
    }
  };
  skip = () => {
    this.complete(true);
  };
  nextPhase = () => {
    if (this.snapshot.stage !== 'boundary' || this.snapshot.paused) return;
    this.advance();
  };
}
