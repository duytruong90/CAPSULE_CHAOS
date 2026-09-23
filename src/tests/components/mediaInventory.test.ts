/// <reference types="node" />
// @vitest-environment node
import { readFileSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { assetManifest } from '../../assets/manifest';
import { cardAssetMap } from '../../assets/showAssets';

describe('installed production media', () => {
  const publicRoot = path.resolve('public');
  it('ships every manifest file with the correct format and no network references', () => {
    for (const asset of Object.values(assetManifest)) {
      const file = path.join(publicRoot, asset.src);
      const bytes = readFileSync(file);
      expect(bytes.length, asset.id).toBeGreaterThan(100);
      if (asset.src.endsWith('.svg')) {
        const source = bytes.toString();
        expect(source, asset.id).toContain('viewBox=');
        expect(source, asset.id).not.toMatch(
          /<script|<foreignObject|<animate|<set\b|(?:href|src)\s*=/u,
        );
      } else if (asset.src.endsWith('.webp')) {
        expect(bytes.toString('ascii', 8, 12), asset.id).toBe('WEBP');
      } else {
        expect(bytes.toString('ascii', 0, 4), asset.id).toBe('RIFF');
        expect(bytes.toString('ascii', 8, 12), asset.id).toBe('WAVE');
        expect(bytes.readUInt32LE(24)).toBe(asset.category === 'breakout' ? 48000 : 24000);
        expect(bytes.readUInt16LE(22)).toBe(asset.category === 'breakout' ? 2 : 1);
        expect(bytes.readUInt32LE(40)).toBe(bytes.length - 44);
        let peak = 0;
        for (let i = 44; i < bytes.length; i += 2)
          peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)));
        expect(peak, asset.id).toBeGreaterThan(1000);
        expect(peak, asset.id).toBeLessThan(30000);
      }
    }
  });
  it('covers every V1 card and keeps the installed pack under 2 MB', () => {
    expect(Object.keys(cardAssetMap)).toHaveLength(16);
    const total = Object.values(assetManifest).filter((asset) => asset.category !== 'breakout').reduce(
      (sum, asset) => sum + statSync(path.join(publicRoot, asset.src)).size,
      0,
    );
    expect(total).toBeLessThan(2_000_000);
    const files = readdirSync(path.join(publicRoot, 'assets'), {
      recursive: true,
      withFileTypes: true,
    }).filter((entry) => entry.isFile());
    expect(files.length).toBe(Object.keys(assetManifest).length);
  });
});
