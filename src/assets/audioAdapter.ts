import { audioManager, type AudioCue } from '../audio/AudioManager';
import type { BreakoutCueBus } from '../presentation/breakout/cueSheet';
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
  'faultline.ambience': 'amb_faultline',
  'faultline.music': 'music_faultline',
  'faultline.shell-ticks': 'sfx_faultline_knock',
  'faultline.knock-1': 'sfx_faultline_knock',
  'faultline.knock-2': 'sfx_faultline_knock',
  'faultline.knock-3': 'sfx_faultline_knock',
  'faultline.warning': 'sfx_faultline_warning',
  'faultline.conveyor': 'sfx_conveyor_shift',
  'faultline.lock-1': 'sfx_sector_safe',
  'faultline.lock-2': 'sfx_sector_safe',
  'faultline.collapse': 'sfx_floor_collapse',
  'faultline.safe': 'sfx_sector_safe',
  'race.ambience': 'amb_escape_run',
  'race.music': 'music_escape_run',
  'race.charge': 'sfx_race_charge',
  'race.ignition': 'sfx_race_charge',
  'race.launch': 'sfx_race_launch',
  'race.photo-finish': 'sfx_photo_finish',
  'race.exit-lock': 'sfx_exit_lock',
  'clash.ambience': 'amb_final_clash',
  'clash.semifinal-music': 'music_clash_semifinal',
  'clash.final-music': 'music_clash_final',
  'clash.charge': 'sfx_clash_charge',
  'clash.flip': 'sfx_clash_flip',
  'clash.pulse-overload': 'sfx_pulse_overload',
  'clash.hack-unlock': 'sfx_hack_unlock',
  'clash.barrier-reflect': 'sfx_barrier_reflect',
  'clash.point': 'sfx_clash_point',
  'clash.advance': 'sfx_clash_advance',
  'clash.winner': 'sfx_breakout_winner',
};

type SoundPlayer = Pick<
  HTMLAudioElement,
  'play' | 'pause' | 'volume' | 'currentTime' | 'onended' | 'onerror'
>;

export function installManifestAudioAdapter(
  createAudio: (src: string) => SoundPlayer = (src) => new Audio(src),
) {
  interface ActiveSound {
    player: SoundPlayer;
    bus: BreakoutCueBus;
    baseGain: number;
  }

  const active = new Set<ActiveSound>();
  let currentEvent: string | undefined;
  let restoreTimer: ReturnType<typeof setTimeout> | null = null;

  const release = (sound: ActiveSound) => {
    active.delete(sound);
    sound.player.onended = null;
    sound.player.onerror = null;
  };

  const stopSound = (sound: ActiveSound) => {
    try {
      sound.player.pause();
      sound.player.currentTime = 0;
    } catch {
      /* Detached media is disposable. */
    }
    release(sound);
  };

  const transientSounds = () =>
    [...active].filter(({ bus }) => bus === 'transient' || bus === 'fanfare');

  const duckBeds = () => {
    for (const sound of active) {
      if (sound.bus === 'music' || sound.bus === 'ambience') {
        sound.player.volume = sound.baseGain / 2;
      }
    }
  };

  const restoreBeds = () => {
    if (restoreTimer !== null) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      for (const sound of active) {
        if (sound.bus === 'music' || sound.bus === 'ambience') {
          sound.player.volume = sound.baseGain;
        }
      }
      restoreTimer = null;
    }, 250);
  };

  const stop = () => {
    if (restoreTimer !== null) clearTimeout(restoreTimer);
    restoreTimer = null;
    for (const sound of [...active]) stopSound(sound);
  };
  const removeMuteListener = audioManager.subscribeMute(() => {
    if (audioManager.isMuted()) stop();
  });
  const removeStopListener = audioManager.subscribeStop(stop);
  const removeCueListener = audioManager.subscribe((event) => {
    if (!event.bus && currentEvent !== event.eventId) stop();
    currentEvent = event.eventId;
    const bus = event.bus ?? 'transient';
    if (bus === 'music' || bus === 'ambience') {
      for (const sound of [...active]) {
        if (sound.bus === bus) stopSound(sound);
      }
    } else {
      const voices = transientSounds();
      if (voices.length >= 2 && voices[0]) stopSound(voices[0]);
    }
    try {
      const player = createAudio(getAsset(cueAssets[event.cue]).src);
      const sound: ActiveSound = {
        player,
        bus,
        baseGain: event.gain ?? 0.72,
      };
      player.volume = sound.baseGain;
      active.add(sound);
      if (bus === 'transient' || bus === 'fanfare') duckBeds();
      const onRelease = () => {
        release(sound);
        if (transientSounds().length === 0) restoreBeds();
      };
      player.onended = onRelease;
      player.onerror = onRelease;
      void player.play().catch(onRelease);
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
