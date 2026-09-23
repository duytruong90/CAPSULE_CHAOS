import { audioManager, type AudioCue } from '../audio/AudioManager';
import { getAsset, type AssetId } from './manifest';
const cueAssets: Readonly<Record<AudioCue, AssetId>> = {
  'capsule.spin': 'sfx_capsule_spin',
  'capsule.drop': 'sfx_capsule_drop',
  'capsule.open': 'sfx_capsule_open',
  'result.elimination': 'sfx_elimination',
  'result.safe': 'sfx_safe',
  'result.revival': 'sfx_revival',
  'result.shield': 'sfx_shield',
  'result.duel': 'sfx_duel',
  'final.heartbeat': 'sfx_heartbeat',
  'final.glitch': 'sfx_glitch',
  'final.winner': 'sfx_winner',
  'card.common.charge': 'sfx_card_flip',
  'card.common.impact': 'sfx_card_flip',
  'card.rare.charge': 'sfx_rare_charge',
  'card.rare.impact': 'sfx_rare_impact',
  'card.epic.charge': 'sfx_epic_charge',
  'card.epic.impact': 'sfx_epic_impact',
  'card.legendary.charge': 'sfx_legendary_charge',
  'card.legendary.impact': 'sfx_legendary_impact',
};

type SoundPlayer = Pick<
  HTMLAudioElement,
  'play' | 'pause' | 'volume' | 'currentTime' | 'onended' | 'onerror'
>;

export function installManifestAudioAdapter(
  createAudio: (src: string) => SoundPlayer = (src) => new Audio(src),
) {
  const active = new Set<SoundPlayer>();
  let currentEvent: string | undefined;
  const stop = () => {
    for (const player of active) {
      try {
        player.pause();
        player.currentTime = 0;
      } catch {
        /* Detached media is disposable. */
      }
      player.onended = null;
      player.onerror = null;
    }
    active.clear();
  };
  const removeMuteListener = audioManager.subscribeMute(() => {
    if (audioManager.isMuted()) stop();
  });
  const removeStopListener = audioManager.subscribeStop(stop);
  const removeCueListener = audioManager.subscribe((event) => {
    if (currentEvent !== event.eventId || active.size >= 3) stop();
    currentEvent = event.eventId;
    try {
      const player = createAudio(getAsset(cueAssets[event.cue]).src);
      player.volume = 0.72;
      active.add(player);
      const release = () => {
        active.delete(player);
        player.onended = null;
        player.onerror = null;
      };
      player.onended = release;
      player.onerror = release;
      void player.play().catch(release);
    } catch {
      /* Missing or blocked audio must not interrupt playback. */
    }
  });
  return () => {
    removeCueListener();
    removeMuteListener();
    removeStopListener();
    stop();
  };
}
