import { fireEvent, render, screen } from '@testing-library/react';
import { installManifestAudioAdapter } from '../../assets/audioAdapter';
import { getAsset, getCriticalAssets } from '../../assets/manifest';
import { preloadAssets } from '../../assets/preloader';
import { audioManager } from '../../audio/AudioManager';
import { AssetImage } from '../../components/AssetMedia/AssetImage';

describe('Astra asset integration', () => {
  it('resolves typed logical IDs and includes critical show assets', () => {
    expect(getAsset('gachapon_base').src).toBe('/assets/machine/gachapon_base.webp');
    expect(getCriticalAssets().map((asset) => asset.id)).toContain('capsule_gold');
  });

  it('uses a safe visual fallback after an image load failure', () => {
    render(<AssetImage assetId="gachapon_base" alt="Machine layer" />);
    const image = screen.getByRole('img', { name: 'Machine layer' });
    fireEvent.error(image);
    expect(image).toHaveAttribute('data-fallback', 'true');
    expect(image.getAttribute('src')).toMatch(/^data:image/);
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
    const createAudio = vi.fn(() => ({ play, volume: 1 }));
    const uninstall = installManifestAudioAdapter(createAudio);
    audioManager.setMuted(true);
    audioManager.cue({ cue: 'capsule.open', eventId: 'muted' }, true);
    expect(createAudio).not.toHaveBeenCalled();
    audioManager.setMuted(false);
    expect(() => audioManager.cue({ cue: 'capsule.open', eventId: 'failure' }, true)).not.toThrow();
    expect(createAudio).toHaveBeenCalled();
    uninstall();
  });
});
