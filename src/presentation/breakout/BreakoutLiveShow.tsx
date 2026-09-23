import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { audioManager } from '../../audio/AudioManager';
import { BreakoutAuditPanel } from '../../components/AuditPanel/BreakoutAuditPanel';
import {
  createBreakoutAuditDocument,
  verifyBreakoutAuditDocument,
  type BreakoutAuditVerification,
} from '../../game/breakout/audit';
import type { LockedBreakoutSession } from '../../game/breakout/session';
import type { BreakoutPlaybackController } from './BreakoutPlaybackController';
import { estimateBreakoutRuntimeMs } from './BreakoutPlaybackController';
import { BreakoutStage } from './BreakoutStage';
import styles from './BreakoutLiveShow.module.css';

export function BreakoutLiveShow({
  session,
  playback,
  title,
  storageStatus,
  onEmergencyReset,
}: {
  session: LockedBreakoutSession;
  playback: BreakoutPlaybackController;
  title: string;
  storageStatus: 'checking' | 'available' | 'unavailable';
  onEmergencyReset: () => void;
}) {
  const state = useSyncExternalStore(playback.subscribe, playback.getSnapshot);
  const muted = useSyncExternalStore(audioManager.subscribeMute, audioManager.isMuted);
  const [verification, setVerification] = useState<BreakoutAuditVerification | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [rosterOpen, setRosterOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const showRef = useRef<HTMLElement>(null);
  const event = playback.currentEvent;
  const audit = useMemo(() => createBreakoutAuditDocument(session, title), [session, title]);
  const official =
    event.type === 'winner.declared' &&
    event.resolutionBaseMs !== null &&
    state.elapsedBaseMs >= event.resolutionBaseMs;
  const controlsVisible =
    official && state.elapsedBaseMs >= (event.segments.controls ?? event.resolutionBaseMs ?? 0);
  const estimatedTotalSeconds = Math.ceil(
    estimateBreakoutRuntimeMs(session.timeline, session.lock.payload.config.animationSpeed) / 1_000,
  );
  const estimatedMinutes = Math.floor(estimatedTotalSeconds / 60);
  const estimatedSeconds = estimatedTotalSeconds % 60;

  useEffect(() => playback.connect(), [playback]);
  useEffect(() => {
    audioManager.setMuted(!session.lock.payload.config.soundEnabled);
  }, [session.lock.payload.config.soundEnabled]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) playback.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [playback]);
  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === showRef.current);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  useEffect(() => {
    if (!official) return;
    let active = true;
    void verifyBreakoutAuditDocument(audit).then((result) => {
      if (active) setVerification(result);
    });
    return () => {
      active = false;
    };
  }, [audit, official]);

  const downloadSession = () => {
    const json = `${JSON.stringify(session, null, 2)}\n`;
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'capsule-chaos-breakout-session.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const openRoster = () => {
    playback.pause();
    setRosterOpen(true);
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await showRef.current?.requestFullscreen();
    } catch {
      /* Fullscreen availability never gates the show. */
    }
  };

  return (
    <section ref={showRef} className={styles.show} aria-label="Live Breakout giveaway">
      <BreakoutStage
        entries={session.simulation.entries}
        event={event}
        elapsedBaseMs={state.elapsedBaseMs}
        reducedMotion={session.lock.payload.config.reducedMotion}
      />
      <div className={styles.showTitle}>{title}</div>
      <div className={styles.lock} title={session.publicLock.commitment.fullHash}>
        LOCK {session.publicLock.commitment.displayHash}
      </div>
      <div className={styles.runtime}>
        EST. {estimatedMinutes}:{String(estimatedSeconds).padStart(2, '0')} · PAUSES EXCLUDED
      </div>
      {storageStatus === 'unavailable' && (
        <div className={styles.storageWarning} role="status">
          Refresh recovery unavailable — download this session.
          <button onClick={downloadSession}>Download this session</button>
        </div>
      )}
      <div className={styles.controls}>
        <span>{state.paused ? (state.atManualBoundary ? 'ACT COMPLETE' : 'PAUSED') : 'LIVE'}</span>
        <button
          className="button buttonSecondary"
          disabled={state.complete || state.atManualBoundary}
          onClick={() => playback.togglePause()}
        >
          {state.paused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="button buttonSecondary"
          disabled={state.complete || state.atManualBoundary}
          onClick={() => playback.skip()}
        >
          Skip
        </button>
        <button
          className="button buttonPrimary"
          disabled={!state.atManualBoundary}
          onClick={() => playback.nextAct()}
        >
          Next Act
        </button>
        <button className="button buttonSecondary" onClick={() => audioManager.toggleMuted()}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button className="button buttonSecondary" onClick={openRoster}>
          Roster
        </button>
        <button className="button buttonSecondary" onClick={() => void toggleFullscreen()}>
          {fullscreen ? 'Exit Show Mode' : 'Show Mode'}
        </button>
        <button className={styles.reset} onClick={() => setResetOpen(true)}>
          Emergency Reset
        </button>
      </div>
      {controlsVisible && <BreakoutAuditPanel audit={audit} verification={verification} />}
      {rosterOpen && (
        <aside className={styles.rosterDrawer} aria-label="Paused roster lookup">
          <header>
            <div>
              <span>PAUSED LOOKUP</span>
              <h2>Complete roster</h2>
            </div>
            <button onClick={() => setRosterOpen(false)}>Close</button>
          </header>
          <p>Closing this drawer leaves the show paused. Use Resume when ready.</p>
          <ol>
            {session.simulation.entries.map((entry) => {
              const status = playback.currentSnapshot.statusById[entry.id] ?? 'eliminated';
              return (
                <li key={entry.id} data-status={status}>
                  <span>#{entry.entryIndex + 1}</span>
                  <strong title={entry.displayName}>{entry.displayName}</strong>
                  <em>{status}</em>
                </li>
              );
            })}
          </ol>
        </aside>
      )}
      {resetOpen && (
        <div
          className={styles.resetDialog}
          role="dialog"
          aria-modal="true"
          aria-label="Emergency reset"
        >
          <div>
            <h2>Abandon this locked Breakout?</h2>
            <p>This removes V4 recovery data. It never rerolls the current winner.</p>
            <input
              autoFocus
              value={resetText}
              aria-label="Type RESET to confirm"
              onChange={(event) => setResetText(event.target.value)}
            />
            <button onClick={() => setResetOpen(false)}>Cancel</button>
            <button disabled={resetText !== 'RESET'} onClick={onEmergencyReset}>
              Abandon session
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
