import { type CSSProperties, useEffect, useSyncExternalStore } from 'react';
import type { LockedGameSession } from '../game/state/gameSession';
import { GachaponMachine } from '../components/GachaponMachine/GachaponMachine';
import { EventRenderer } from './EventRenderer';
import type { PlaybackController } from './playbackController';
import styles from './GameShow.module.css';

export function GameShow({
  session,
  playback,
  title,
}: {
  session: LockedGameSession;
  playback: PlaybackController;
  title: string;
}) {
  const state = useSyncExternalStore(playback.subscribe, playback.getSnapshot);
  useEffect(() => playback.connect(), [playback]);
  const event = playback.event;
  const durationMs = playback.duration;
  const isPlaying = state.stage === 'intro' || state.stage === 'event';
  return (
    <section className={styles.show} aria-label="Live giveaway">
      <div className={styles.hud}>
        <div>
          <span className={styles.title}>{title}</span>
          <h2>
            {state.stage === 'intro'
              ? 'OPENING CEREMONY'
              : state.stage === 'handoff'
                ? 'PHASE II — UP NEXT'
                : 'PHASE I — THE PURGE'}
          </h2>
        </div>
        <div className={styles.counter} aria-live="polite">
          <strong>{state.remaining}</strong>
          <span>REMAINING</span>
        </div>
      </div>
      <div
        className={styles.arena}
        style={
          { '--duration': `${durationMs}ms`, '--elapsed': `${state.elapsedMs}ms` } as CSSProperties
        }
      >
        <div className={styles.machine}>
          <GachaponMachine
            key={event?.id ?? 'intro'}
            spinning={event?.type === 'capsule-spin' && !state.settled}
          />
        </div>
        <div key={event?.id ?? state.stage} className={styles.presentation}>
          {state.stage === 'intro' ? (
            <div className={styles.intro}>
              <p>THE ENTRIES ARE SEALED</p>
              <h1>GAME LOCKED</h1>
              <strong>{session.publicLock.entryCount} PLAYERS · 1 WINNER</strong>
              <p>The Purge begins automatically.</p>
            </div>
          ) : state.stage === 'handoff' ? (
            <div className={styles.intro}>
              <p>UP NEXT</p>
              <h1>CHAOS AWAKENS</h1>
              <p>Phase II presentation arrives in Build Step 10.</p>
              <strong>{state.remaining} survivors are ready.</strong>
            </div>
          ) : (
            event && (
              <EventRenderer
                event={event}
                entries={session.lock.payload.entries}
                settled={state.settled}
                durationMs={durationMs}
              />
            )
          )}
        </div>
      </div>
      <footer className={styles.footer}>
        <div className={styles.commitment}>
          <b>GAME LOCKED · SHA-256 COMMITMENT</b>
          <span title={session.publicLock.commitment.fullHash}>
            {session.publicLock.commitment.displayHash}
          </span>
        </div>
        <div className={styles.controls}>
          {state.paused && (
            <span role="status">{state.settled ? 'Paused' : 'Pausing after this animation…'}</span>
          )}
          <button
            className="button buttonSecondary"
            disabled={state.stage === 'handoff'}
            onClick={playback.togglePause}
          >
            {state.paused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="button buttonSecondary"
            disabled={!isPlaying || state.settled}
            onClick={playback.skip}
          >
            Skip animation
          </button>
          <button
            className="button buttonPrimary"
            disabled={state.stage !== 'boundary' || state.paused}
            onClick={playback.nextPhase}
          >
            Next Phase
          </button>
        </div>
      </footer>
    </section>
  );
}
