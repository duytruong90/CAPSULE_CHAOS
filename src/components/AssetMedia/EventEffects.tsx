import type { TimelineEvent } from '../../game/timeline/eventTypes';
import { effectsForEvent } from '../../assets/showAssets';
import { AssetImage } from './AssetImage';
import styles from './EventEffects.module.css';

export function EventEffects({ event, settled }: { event: TimelineEvent; settled: boolean }) {
  return (
    <div className={styles.effects} data-settled={settled} aria-hidden="true">
      {effectsForEvent(event).map((id) => (
        <AssetImage key={id} assetId={id} className={styles.effect} data-effect={id} />
      ))}
    </div>
  );
}
