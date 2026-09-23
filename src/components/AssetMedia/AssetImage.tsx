import { useState, type ImgHTMLAttributes } from 'react';
import { getAsset, type AssetId } from '../../assets/manifest';
export function AssetImage({
  assetId,
  alt = '',
  ...props
}: { assetId: AssetId } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  const asset = getAsset(assetId);
  const [src, setSrc] = useState(asset.src);
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      data-asset-id={assetId}
      data-fallback={src === asset.fallbackSrc}
      onError={(event) => {
        props.onError?.(event);
        if (asset.fallbackSrc && src !== asset.fallbackSrc) setSrc(asset.fallbackSrc);
      }}
    />
  );
}
