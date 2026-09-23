import { getCriticalAssets, type AssetDefinition } from './manifest';
export interface AssetPreloadResult {
  loaded: readonly string[];
  failed: readonly string[];
  timedOut: boolean;
}
type AssetLoader = (asset: AssetDefinition) => Promise<void>;
export function browserAssetLoader(asset: AssetDefinition): Promise<void> {
  return new Promise((resolve, reject) => {
    if (asset.kind === 'image') {
      const element = new Image();
      element.onload = () => resolve();
      element.onerror = () => reject(new Error(`Unable to preload ${asset.id}.`));
      element.src = asset.src;
      return;
    }
    const element = document.createElement(asset.kind === 'audio' ? 'audio' : 'video');
    element.preload = 'auto';
    element.oncanplaythrough = () => resolve();
    element.onerror = () => reject(new Error(`Unable to preload ${asset.id}.`));
    element.src = asset.src;
    element.load();
  });
}
export async function preloadAssets(
  assets: readonly AssetDefinition[] = getCriticalAssets(),
  loader: AssetLoader = browserAssetLoader,
  timeoutMs = 5000,
): Promise<AssetPreloadResult> {
  const loaded: string[] = [];
  const failed: string[] = [];
  let timedOut = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const work = Promise.all(
    assets.map(async (asset) => {
      try {
        await loader(asset);
        loaded.push(asset.id);
      } catch {
        failed.push(asset.id);
      }
    }),
  );
  await Promise.race([
    work,
    new Promise<void>((resolve) => {
      timeout = setTimeout(() => {
        timedOut = true;
        resolve();
      }, timeoutMs);
    }),
  ]);
  clearTimeout(timeout);
  return { loaded, failed, timedOut };
}
