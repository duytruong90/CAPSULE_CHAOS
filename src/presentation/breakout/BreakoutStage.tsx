import type { BreakoutTimelineEvent } from '../../game/breakout/buildBreakoutTimeline';
import type { BreakoutEntry } from '../../game/breakout/types';
import { FaultlineStage } from './FaultlineStage';
import styles from './BreakoutStage.module.css';

interface BreakoutStageProps {
  entries: readonly BreakoutEntry[];
  event: BreakoutTimelineEvent;
  elapsedBaseMs: number;
  reducedMotion?: boolean;
}

export function BreakoutStage({
  entries,
  event,
  elapsedBaseMs,
  reducedMotion = false,
}: BreakoutStageProps) {
  const engineEvent = event.engineEvent;
  switch (engineEvent.type) {
    case 'show.locked':
      return (
        <section className={styles.interstitial}>
          <p>CAPSULE CHAOS · BREAKOUT</p>
          <h1>OUTCOME LOCKED</h1>
          <strong>{engineEvent.payload.rosterCount} ENTRIES</strong>
          <span>{engineEvent.payload.publicCommitment}</span>
        </section>
      );
    case 'act.started':
      return (
        <section className={`${styles.interstitial} ${styles.faultlineIntro}`}>
          <p>ACT 1</p>
          <h1>FAULTLINE</h1>
          <strong>FIND YOUR SECTOR.</strong>
          <span>Two sectors collapse each wave. If we reach wave two, the conveyor moves everyone before the drop.</span>
        </section>
      );
    case 'faultline.wave-resolved':
      return (
        <FaultlineStage
          entries={entries}
          event={engineEvent}
          elapsedBaseMs={elapsedBaseMs}
          reducedMotion={reducedMotion}
        />
      );
    case 'act.completed':
      return (
        <section className={`${styles.interstitial} ${styles.completion}`}>
          <p>FAULTLINE COMPLETE</p>
          <h1>{engineEvent.payload.outputIds.length} SURVIVORS</h1>
          <strong>FOUR EXITS AHEAD.</strong>
          <div className={styles.nameList}>
            {engineEvent.payload.outputIds.map((id) => (
              <span key={id}>{entries.find((entry) => entry.id === id)?.displayName ?? id}</span>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}
