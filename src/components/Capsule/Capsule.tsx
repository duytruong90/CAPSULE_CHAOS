import styles from './Capsule.module.css';
import { AssetImage } from '../AssetMedia/AssetImage';

export function Capsule({
  open = false,
  color = 'red',
}: {
  open?: boolean;
  color?: 'red' | 'blue' | 'green' | 'gold';
}) {
  return (
    <div className={styles.capsule} data-open={open} aria-hidden="true">
      <span>
        <AssetImage assetId={`capsule_${color}`} />
      </span>
      <span>
        <AssetImage assetId={`capsule_${color}`} />
      </span>
    </div>
  );
}
