export interface AssetManifest {
  readonly images: Readonly<Record<string, string>>;
  readonly audio: Readonly<Record<string, string>>;
  readonly video: Readonly<Record<string, string>>;
}

// Production Astra assets will be registered here during Phase 17. Keeping this
// boundary in place now prevents presentation assets from leaking into game logic.
export const assetManifest: AssetManifest = Object.freeze({
  images: Object.freeze({}),
  audio: Object.freeze({}),
  video: Object.freeze({}),
});
