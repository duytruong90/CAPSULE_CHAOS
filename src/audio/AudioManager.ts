import type { CardRarity } from '../game/cards/cardTypes';

export type AudioCue =
  | 'capsule.spin'
  | 'capsule.open'
  | 'result.elimination'
  | 'result.safe'
  | 'result.revival'
  | `card.${CardRarity}.charge`
  | `card.${CardRarity}.impact`;
export interface AudioCueEvent {
  cue: AudioCue;
  eventId: string;
}

/** Asset adapters may subscribe here. Missing audio never gates visual completion. */
export class AudioManager {
  private listeners = new Set<(event: AudioCueEvent) => void>();
  subscribe(listener: (event: AudioCueEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  cue(event: AudioCueEvent, enabled: boolean) {
    if (!enabled) return;
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        /* Sound failure must not interrupt the show. */
      }
    }
  }
}

export const audioManager = new AudioManager();
