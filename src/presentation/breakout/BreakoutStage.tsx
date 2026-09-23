import type { BreakoutTimelineEvent } from '../../game/breakout/buildBreakoutTimeline';
import type { BreakoutEntry } from '../../game/breakout/types';
import { EscapeRunStage } from './EscapeRunStage';
import { FaultlineStage } from './FaultlineStage';
import { FinalClashStage } from './FinalClashStage';
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
      if (engineEvent.payload.actId === 'act-3') {
        return (
          <section className={`${styles.interstitial} ${styles.finalClashIntro}`}>
            <p>ACT 3</p>
            <h1>FINAL CLASH</h1>
            <strong>THREE MOVES. ONE POINT EVERY EXCHANGE.</strong>
            <span>Pulse beats Hack · Hack beats Barrier · Barrier beats Pulse.</span>
          </section>
        );
      }
      if (engineEvent.payload.actId === 'act-2') {
        return (
          <section className={`${styles.interstitial} ${styles.escapeRunIntro}`}>
            <p>ACT 2</p>
            <h1>ESCAPE RUN</h1>
            <strong>FOUR EXITS. EVERYONE MOVES TOGETHER.</strong>
            <span>
              Everyone has 1, 1, 2, 2, 3, 3 in a different order. First four to distance 9 escape.
            </span>
          </section>
        );
      }
      return (
        <section className={`${styles.interstitial} ${styles.faultlineIntro}`}>
          <p>ACT 1</p>
          <h1>FAULTLINE</h1>
          <strong>FIND YOUR SECTOR.</strong>
          <span>
            Two sectors collapse each wave. If we reach wave two, the conveyor moves everyone before
            the drop.
          </span>
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
    case 'race.beat-resolved':
      return (
        <EscapeRunStage
          entries={entries}
          event={engineEvent}
          elapsedBaseMs={elapsedBaseMs}
          reducedMotion={reducedMotion}
        />
      );
    case 'clash.bracket-ready':
    case 'clash.exchange-resolved':
    case 'clash.final-ready':
    case 'winner.declared':
      return (
        <FinalClashStage
          entries={entries}
          event={engineEvent}
          elapsedBaseMs={elapsedBaseMs}
          reducedMotion={reducedMotion}
        />
      );
    case 'act.completed':
      if (engineEvent.payload.actId === 'act-2') {
        return (
          <section className={`${styles.interstitial} ${styles.raceCompletion}`}>
            <p>ESCAPE RUN COMPLETE</p>
            <h1>FINAL FOUR</h1>
            <strong>DISTANCE RESETS. THE FINAL FOUR FACE OFF.</strong>
            <div className={styles.nameList}>
              {engineEvent.payload.outputIds.map((id, index) => (
                <span key={id}>
                  SLOT {index + 1} · {entries.find((entry) => entry.id === id)?.displayName ?? id}
                </span>
              ))}
            </div>
          </section>
        );
      }
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
