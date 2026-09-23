import { audioManager, type AudioCue } from '../audio/AudioManager';
import { getAsset, type AssetId } from './manifest';
const cueAssets: Readonly<Record<AudioCue, AssetId>> = {
  'capsule.spin': 'sfx_capsule_spin',
  'capsule.open': 'sfx_capsule_open',
  'result.elimination': 'sfx_elimination',
  'result.safe': 'sfx_safe',
  'result.revival': 'sfx_revival',
  'final.heartbeat': 'sfx_capsule_spin',
  'final.glitch': 'sfx_glitch',
  'final.winner': 'sfx_winner',
  'card.common.charge': 'sfx_card_flip',
  'card.common.impact': 'sfx_card_flip',
  'card.rare.charge': 'sfx_card_flip',
  'card.rare.impact': 'sfx_card_flip',
  'card.epic.charge': 'sfx_card_flip',
  'card.epic.impact': 'sfx_card_flip',
  'card.legendary.charge': 'sfx_card_flip',
  'card.legendary.impact': 'sfx_card_flip',
};
export function installManifestAudioAdapter(
  createAudio: (src: string) => Pick<HTMLAudioElement, 'play' | 'volume'> = (src) => new Audio(src),
) {
  return audioManager.subscribe((event) => {
    try {
      const player = createAudio(getAsset(cueAssets[event.cue]).src);
      player.volume = 0.72;
      void player.play().catch(() => undefined);
    } catch {
      /* Missing or blocked audio must not interrupt playback. */
    }
  });
}
