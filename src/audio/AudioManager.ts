import type { CardRarity } from '../game/cards/cardTypes';

export type AudioCue =
  | 'capsule.spin'
  | 'capsule.drop'
  | 'capsule.open'
  | 'result.elimination'
  | 'result.safe'
  | 'result.revival'
  | 'result.shield'
  | 'result.duel'
  | 'final.heartbeat'
  | 'final.glitch'
  | 'final.winner'
  | `card.${CardRarity}.charge`
  | `card.${CardRarity}.impact`;
export interface AudioCueEvent {
  cue: AudioCue;
  eventId: string;
}

/** Asset adapters may subscribe here. Missing audio never gates visual completion. */
export class AudioManager {
  private listeners = new Set<(event: AudioCueEvent) => void>();
  private muteListeners = new Set<() => void>();
  private muted = false;
  private stopListeners = new Set<() => void>();
  subscribeStop(listener: () => void) {
    this.stopListeners.add(listener);
    return () => {
      this.stopListeners.delete(listener);
    };
  }
  stopAll() {
    for (const listener of this.stopListeners) {
      try {
        listener();
      } catch {
        /* Optional media. */
      }
    }
  }
  subscribe(listener: (event: AudioCueEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  cue(event: AudioCueEvent, enabled: boolean) {
    if (!enabled || this.muted) return;
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        /* Sound failure must not interrupt the show. */
      }
    }
  }
  isMuted = () => this.muted;
  subscribeMute = (listener: () => void) => {
    this.muteListeners.add(listener);
    return () => this.muteListeners.delete(listener);
  };
  setMuted(muted: boolean) {
    if (this.muted === muted) return;
    this.muted = muted;
    this.muteListeners.forEach((listener) => listener());
  }
  toggleMuted() {
    this.setMuted(!this.muted);
  }
}

export const audioManager = new AudioManager();
