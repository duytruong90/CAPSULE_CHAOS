import type { TimelineEvent } from '../game/timeline/eventTypes';
import type { LockedEntry } from '../game/engine/commitment';
import { Capsule } from '../components/Capsule/Capsule';
import { ChaosCard } from '../components/ChaosCard/ChaosCard';
import { PlayerReveal } from '../components/PlayerReveal/PlayerReveal';
import styles from './EventRenderer.module.css';

interface EventRendererProps {
  event: TimelineEvent;
  entries: readonly LockedEntry[];
  settled: boolean;
  durationMs: number;
}

export function EventRenderer({ event, entries, settled, durationMs }: EventRendererProps) {
  const nameFor = (id: string) =>
    entries.find((entry) => entry.id === id)?.displayName ?? 'Unknown player';
  const name = nameFor(event.participants[0] ?? '');
  switch (event.type) {
    case 'capsule-spin':
      return (
        <div className={styles.draw} data-settled={settled}>
          <p className={styles.kicker}>THE NEXT CAPSULE</p>
          <div className={styles.dropping}>
            <Capsule />
          </div>
          <p className={styles.caption}>One draw. One fate.</p>
        </div>
      );
    case 'player-reveal':
      return (
        <div className={styles.draw} data-settled={settled}>
          <div className={styles.opening}>
            <Capsule open />
          </div>
          <div className={styles.rising}>
            <PlayerReveal
              name={name}
              label={event.payload.marked ? 'MARKED · ELIMINATION CHECK' : 'FATE CHECK'}
            />
          </div>
        </div>
      );
    case 'card-reveal':
      return (
        <ChaosCard
          {...event.payload}
          presentationKey={event.presentationKey}
          targetText={event.participants.map(nameFor).join(' · ')}
          durationMs={durationMs}
          settled={settled}
        />
      );
    case 'elimination':
      return (
        <div className={styles.result} data-settled={settled}>
          <div className={styles.slash} aria-hidden="true" />
          <PlayerReveal name={name} label="ELIMINATED" tone="danger" />
          <p className={styles.caption}>The capsule has spoken.</p>
        </div>
      );
    case 'safe':
    case 'protection':
    case 'revival':
      return (
        <div className={`${styles.result} ${styles.rescue}`} data-settled={settled}>
          <div className={styles.rescueSymbol} aria-hidden="true">
            {event.type === 'revival' ? '✚' : '⬡'}
          </div>
          <PlayerReveal
            name={name}
            tone="safe"
            label={
              event.type === 'revival'
                ? 'BACK FROM CHAOS · RETURNED'
                : event.type === 'protection'
                  ? event.payload.protection === 'shield'
                    ? 'BLOCKED · SAFE'
                    : 'SECOND LIFE · NOT YET'
                  : 'SAFE'
            }
          />
        </div>
      );
    case 'phase-transition':
      return (
        <div className={styles.phase}>
          <p className={styles.kicker}>
            {event.payload.status === 'complete' ? 'PHASE I COMPLETE' : 'PHASE I'}
          </p>
          <h1>
            {event.payload.status === 'complete'
              ? `${event.payload.activeCount} SURVIVORS`
              : 'THE PURGE'}
          </h1>
          <p>
            {event.payload.status === 'complete'
              ? 'THE EASY PART IS OVER.'
              : 'Drawn capsules face elimination. Chaos can change their fate.'}
          </p>
          {event.payload.status === 'started' && (
            <strong>THE TARGET: {event.payload.targetCount} SURVIVORS</strong>
          )}
        </div>
      );
    default:
      return <p>Presentation for this phase is not available yet.</p>;
  }
}
