import { useState, type ImgHTMLAttributes } from 'react';
import { getAsset, type AssetId } from '../../assets/manifest';
export function AssetImage({
  assetId,
  alt = '',
  ...props
}: { assetId: AssetId } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  const asset = getAsset(assetId);
  const [failedSource, setFailedSource] = useState<string>();
  const [loadedSource, setLoadedSource] = useState<string>();
  const failed = failedSource === asset.src;
  const src = failed ? asset.fallbackSrc : asset.src;
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      data-asset-id={assetId}
      data-fallback={failed}
      data-loaded={!failed && loadedSource === asset.src}
      decoding="async"
      onLoad={(event) => {
        if (!failed) setLoadedSource(asset.src);
        props.onLoad?.(event);
      }}
      onError={(event) => {
        props.onError?.(event);
        if (!failed) setFailedSource(asset.src);
      }}
    />
  );
}
