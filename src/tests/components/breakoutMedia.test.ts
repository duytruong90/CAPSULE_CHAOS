/// <reference types="node" />
// @vitest-environment node
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { assetManifest } from '../../assets/manifest';

describe('Faultline media pack', () => {
  const assets = Object.values(assetManifest).filter((asset) => asset.category === 'breakout');

  it('contains every mandatory Act 1 asset at its explicit local path', () => {
    expect(assets.map((asset) => asset.id)).toEqual([
      'bg_faultline',
      'fx_floor_cracks',
      'fx_floor_dust',
      'icon_sector',
      'icon_conveyor',
      'sfx_faultline_knock',
      'sfx_faultline_warning',
      'sfx_conveyor_shift',
      'sfx_floor_collapse',
      'sfx_sector_safe',
      'amb_faultline',
      'music_faultline',
      'bg_escape_run',
      'img_exit_gate',
      'fx_capsule_exhaust',
      'icon_exit',
      'icon_burst',
      'icon_photo_finish',
      'sfx_race_charge',
      'sfx_race_launch',
      'sfx_exit_lock',
      'sfx_photo_finish',
      'amb_escape_run',
      'music_escape_run',
    ]);
    assets.forEach((asset) => {
      expect(asset.src).toBe(
        `/assets/breakout/${asset.id}.${asset.kind === 'audio' ? 'wav' : 'svg'}`,
      );
      expect(statSync(path.join('public', asset.src)).size).toBeGreaterThan(100);
    });
  });

  it('uses safe SVG and 48 kHz, 16-bit, stereo PCM at no more than -3 dBFS', () => {
    assets.forEach((asset) => {
      const bytes = readFileSync(path.join('public', asset.src));
      if (asset.kind === 'image') {
        const source = bytes.toString();
        expect(source).toContain('viewBox=');
        expect(source).not.toMatch(/<script|<foreignObject|<animate|<set\b|(?:href|src)\s*=/u);
        return;
      }
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.readUInt16LE(22)).toBe(2);
      expect(bytes.readUInt32LE(24)).toBe(48_000);
      expect(bytes.readUInt16LE(34)).toBe(16);
      let peak = 0;
      for (let index = 44; index < bytes.length; index += 2) {
        peak = Math.max(peak, Math.abs(bytes.readInt16LE(index)));
      }
      expect(peak).toBeGreaterThan(1_000);
      expect(peak).toBeLessThanOrEqual(Math.floor(32767 * 10 ** (-3 / 20)) + 1);
    });
  });
});
