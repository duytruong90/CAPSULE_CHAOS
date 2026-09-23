import { fireEvent, render, screen } from '@testing-library/react';
import { installManifestAudioAdapter } from '../../assets/audioAdapter';
import { getAsset, getCriticalAssets } from '../../assets/manifest';
import { preloadAssets } from '../../assets/preloader';
import { audioManager } from '../../audio/AudioManager';
import { AssetImage } from '../../components/AssetMedia/AssetImage';

describe('Astra asset integration', () => {
  it('resolves typed logical IDs and includes critical show assets', () => {
    expect(getAsset('gachapon_base').src).toBe('/assets/machine/gachapon_base.svg');
    expect(getCriticalAssets().map((asset) => asset.id)).toContain('capsule_gold');
  });

  it('uses a safe visual fallback after an image load failure', () => {
    render(<AssetImage assetId="gachapon_base" alt="Machine layer" />);
    const image = screen.getByRole('img', { name: 'Machine layer' });
    fireEvent.error(image);
    expect(image).toHaveAttribute('data-fallback', 'true');
    expect(image.getAttribute('src')).toMatch(/^data:image/);
  });

  it('loads the new image when a live logical asset ID changes, including after a failure', () => {
    const view = render(<AssetImage assetId="bg_arena_main" alt="Arena" />);
    const image = screen.getByRole('img', { name: 'Arena' });
    fireEvent.error(image);
    view.rerender(<AssetImage assetId="bg_arena_final" alt="Arena" />);
    expect(image).toHaveAttribute('src', getAsset('bg_arena_final').src);
    expect(image).toHaveAttribute('data-fallback', 'false');
    fireEvent.load(image);
    expect(image).toHaveAttribute('data-loaded', 'true');
  });

  it('stops audible sounds on mute, event replacement, skip, and adapter disposal', () => {
    const players: Array<{
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      volume: number;
      currentTime: number;
      onended: null;
      onerror: null;
    }> = [];
    const uninstall = installManifestAudioAdapter(() => {
      const player = {
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        volume: 1,
        currentTime: 0,
        onended: null,
        onerror: null,
      };
      players.push(player);
      return player;
    });
    audioManager.setMuted(false);
    audioManager.cue({ cue: 'final.heartbeat', eventId: 'a' }, true);
    audioManager.setMuted(true);
    expect(players[0]!.pause).toHaveBeenCalledOnce();
    audioManager.setMuted(false);
    audioManager.cue({ cue: 'final.winner', eventId: 'b' }, true);
    audioManager.cue({ cue: 'capsule.spin', eventId: 'c' }, true);
    expect(players[1]!.pause).toHaveBeenCalledOnce();
    audioManager.stopAll();
    expect(players[2]!.pause).toHaveBeenCalledOnce();
    audioManager.cue({ cue: 'capsule.open', eventId: 'd' }, true);
    uninstall();
    expect(players[3]!.pause).toHaveBeenCalledOnce();
  });

  it('reports preload successes and failures without rejecting the show', async () => {
    const assets = [getAsset('capsule_gold'), getAsset('card_back')];
    const result = await preloadAssets(assets, (asset) =>
      asset.id === 'card_back' ? Promise.reject(new Error('missing')) : Promise.resolve(),
    );
    expect(result.loaded).toEqual(['capsule_gold']);
    expect(result.failed).toEqual(['card_back']);
    expect(result.timedOut).toBe(false);
  });

  it('isolates missing audio and honors global mute', () => {
    const play = vi.fn(() => Promise.reject(new Error('autoplay blocked')));
    const createAudio = vi.fn(() => ({
      play,
      pause: vi.fn(),
      currentTime: 0,
      volume: 1,
      onended: null,
      onerror: null,
    }));
    const uninstall = installManifestAudioAdapter(createAudio);
    audioManager.setMuted(true);
    audioManager.cue({ cue: 'capsule.open', eventId: 'muted' }, true);
    expect(createAudio).not.toHaveBeenCalled();
    audioManager.setMuted(false);
    expect(() => audioManager.cue({ cue: 'capsule.open', eventId: 'failure' }, true)).not.toThrow();
    expect(createAudio).toHaveBeenCalled();
    uninstall();
  });

  it('keeps one music bed, one ambience bed, and the two newest transient voices', () => {
    const players: Array<{
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      volume: number;
      currentTime: number;
      onended: null | (() => void);
      onerror: null | (() => void);
    }> = [];
    const uninstall = installManifestAudioAdapter(() => {
      const player = {
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        volume: 1,
        currentTime: 0,
        onended: null,
        onerror: null,
      };
      players.push(player);
      return player;
    });
    audioManager.setMuted(false);
    audioManager.cue(
      { cue: 'faultline.ambience', eventId: 'wave', bus: 'ambience', gain: 0.12 },
      true,
    );
    audioManager.cue({ cue: 'faultline.music', eventId: 'wave', bus: 'music', gain: 0.18 }, true);
    for (const cue of ['faultline.knock-1', 'faultline.knock-2', 'faultline.knock-3'] as const) {
      audioManager.cue({ cue, eventId: 'wave', bus: 'transient', gain: 0.45 }, true);
    }

    expect(players).toHaveLength(5);
    expect(players[0]!.pause).not.toHaveBeenCalled();
    expect(players[1]!.pause).not.toHaveBeenCalled();
    expect(players[2]!.pause).toHaveBeenCalledOnce();
    expect(players[0]!.volume).toBe(0.06);
    expect(players[1]!.volume).toBe(0.09);
    uninstall();
  });
});
