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
          <p className={styles.kicker}>
            {event.phase === 'phase-3'
              ? 'NEXT FATE'
              : event.payload.drawRule === 'safe'
                ? 'THE DRAWN CAPSULE IS SAFE'
                : 'THE NEXT CAPSULE'}
          </p>
          {event.payload.nearMiss && (
            <div className={styles.nearMiss} aria-label="A capsule nearly drops, then bounces away">
              <Capsule />
            </div>
          )}
          <div className={styles.dropping}>
            <Capsule />
          </div>
          <p className={styles.caption}>
            {event.payload.firstSafeDraw ? 'NEW RULE · SELECTED MEANS SAFE' : 'One draw. One fate.'}
          </p>
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
              label={
                event.payload.drawRule === 'safe'
                  ? 'SAFE DRAW · ADVANCING'
                  : event.payload.marked
                    ? 'MARKED · ELIMINATION CHECK'
                    : 'FATE CHECK'
              }
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
    case 'protection-granted':
    case 'phase-lock':
    case 'state-restored':
    case 'revival':
      return (
        <div className={`${styles.result} ${styles.rescue}`} data-settled={settled}>
          <div className={styles.rescueSymbol} aria-hidden="true">
            {event.type === 'revival'
              ? '✚'
              : event.type === 'phase-lock'
                ? '◆'
                : event.type === 'state-restored'
                  ? '⊘'
                  : '⬡'}
          </div>
          <PlayerReveal
            name={name}
            tone="safe"
            label={
              event.type === 'revival'
                ? 'BACK FROM CHAOS · RETURNED'
                : event.type === 'phase-lock'
                  ? 'PHASE LOCKED · SAFE UNTIL NEXT PHASE'
                  : event.type === 'state-restored'
                    ? 'CHAOS DENIED · STATE RESTORED'
                    : event.type === 'protection-granted'
                      ? `${event.payload.protection === 'shield' ? 'SHIELD' : 'SECOND LIFE'} ACQUIRED`
                      : event.type === 'protection'
                        ? event.payload.protection === 'shield'
                          ? 'BLOCKED · SAFE'
                          : 'SECOND LIFE · NOT YET'
                        : 'SAFE'
            }
          />
        </div>
      );
    case 'duel':
      return (
        <div className={styles.duel} data-settled={settled}>
          <PlayerReveal name={nameFor(event.payload.winnerId)} label="DUEL WINNER" tone="safe" />
          <strong>VS</strong>
          <PlayerReveal
            name={nameFor(event.payload.loserId)}
            label="FACES ELIMINATION"
            tone="danger"
          />
        </div>
      );
    case 'phase-transition': {
      const copy = {
        'phase-1': ['PHASE I', 'THE PURGE', 'THE EASY PART IS OVER.'],
        'phase-2': ['PHASE II', 'CHAOS AWAKENS', 'FROM THIS POINT, EVERY CAPSULE MATTERS.'],
        'phase-3': ['PHASE III', 'SURVIVAL', 'THE RULES ARE ABOUT TO CHANGE.'],
        'phase-4': ['NEW RULE', 'THE CAPSULE DRAWN IS SAFE', 'THREE CAPSULES WILL ADVANCE.'],
        'phase-5': ['FINAL FATE', 'THREE BECOME TWO', 'ONE MAJOR TWIST MAY REMAIN.'],
        final: ['FINAL', 'LAST CAPSULE', 'THE RESULT IS ALREADY LOCKED.'],
      }[event.phase];
      return (
        <div className={styles.phase}>
          <p className={styles.kicker}>
            {event.payload.status === 'complete' ? `${copy[0]} COMPLETE` : copy[0]}
          </p>
          <h1>
            {event.payload.status === 'complete'
              ? event.phase === 'phase-2'
                ? '10 REMAIN.'
                : event.phase === 'phase-3'
                  ? 'FINAL FIVE'
                  : event.phase === 'phase-4'
                    ? 'FINAL THREE'
                    : event.phase === 'phase-5'
                      ? 'FINAL TWO'
                      : `${event.payload.activeCount} SURVIVORS`
              : copy[1]}
          </h1>
          {event.phase === 'phase-4' && event.payload.status === 'started' && (
            <strong>FROM NOW ON…</strong>
          )}
          <p>{copy[2]}</p>
          {event.payload.status === 'started' && (
            <strong>THE TARGET: {event.payload.targetCount} SURVIVORS</strong>
          )}
        </div>
      );
    }
    case 'final-fate':
      return (
        <div className={styles.phase} data-settled={settled}>
          <p className={styles.kicker}>FINAL FATE CHECK</p>
          <h1>{event.payload.outcome.replaceAll('-', ' ').toUpperCase()}</h1>
          <p>{event.payload.advancingPlayerIds.map(nameFor).join(' · ')} ADVANCE TO THE FINAL</p>
        </div>
      );
    case 'final-chamber':
      return (
        <div className={styles.finalChamber} data-settled={settled}>
          <p className={styles.kicker}>LAST CAPSULE</p>
          <div className={styles.finalists}>
            {event.participants.map((id) => (
              <PlayerReveal key={id} name={nameFor(id)} label="FINALIST" />
            ))}
          </div>
          <div className={styles.countdown} aria-label="Countdown 3 2 1">
            3&nbsp;&nbsp;2&nbsp;&nbsp;1
          </div>
          <Capsule />
        </div>
      );
    case 'fake-winner': {
      const fakeCopy = {
        'false-celebration': ['WINNER', 'RESULT NOT FINAL'],
        recalculation: ['CALCULATING… 99%', 'FATE CONFLICT · RECALCULATING'],
        'capsule-refusal': ['CAPSULE LOCKED', 'FINAL FATE CARD DETECTED'],
        'double-reveal': ['TWO CAPSULES', 'IMPOSSIBLE RESULT'],
      }[event.payload.variant];
      return (
        <div className={styles.fakeout} data-variant={event.payload.variant} data-settled={settled}>
          <p className={styles.kicker}>{fakeCopy[0]}</p>
          {event.payload.variant === 'capsule-refusal' && <Capsule />}
          {event.payload.variant === 'double-reveal' ? (
            <div className={styles.doubleReveal}>
              {event.participants.map((id) => (
                <PlayerReveal key={id} name={nameFor(id)} label="REVEALED" />
              ))}
            </div>
          ) : (
            <h1>{nameFor(event.payload.apparentWinnerId)}</h1>
          )}
          <strong>{fakeCopy[1]}</strong>
          <p>This theatrical result is not official.</p>
        </div>
      );
    }
    case 'winner':
      return (
        <div className={styles.phase} data-settled={settled}>
          <p className={styles.kicker}>FINAL RESULT LOCKED</p>
          <h1>{nameFor(event.payload.winnerId)}</h1>
          <p>The official winner and audit reveal continue in Phase 15.</p>
        </div>
      );
    default:
      return <p>Presentation for this phase is not available yet.</p>;
  }
}
