import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { LockedGameSession } from '../game/state/gameSession';
import {
  createAuditDocument,
  verifyAuditDocument,
  type AuditVerification,
} from '../game/audit/audit';
import { AuditPanel } from '../components/AuditPanel/AuditPanel';
import { GachaponMachine } from '../components/GachaponMachine/GachaponMachine';
import { SurvivorBoard } from '../components/SurvivorBoard/SurvivorBoard';
import { WinnerScreen } from '../components/WinnerScreen/WinnerScreen';
import { EventRenderer } from './EventRenderer';
import type { PlaybackController } from './playbackController';
import styles from './GameShow.module.css';
import { audioManager } from '../audio/AudioManager';

export function GameShow({
  session,
  playback,
  title,
  onEmergencyReset,
}: {
  session: LockedGameSession;
  playback: PlaybackController;
  title: string;
  onEmergencyReset?: () => void;
}) {
  const state = useSyncExternalStore(playback.subscribe, playback.getSnapshot);
  const [verification, setVerification] = useState<AuditVerification | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [showMode, setShowMode] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const showRef = useRef<HTMLElement>(null);
  const muted = useSyncExternalStore(audioManager.subscribeMute, audioManager.isMuted);
  useEffect(() => playback.connect(), [playback]);
  useEffect(() => {
    audioManager.setMuted(!session.lock.payload.config.soundEnabled);
  }, [session.lock.payload.config.soundEnabled]);
  const audit = useMemo(() => createAuditDocument(session, title), [session, title]);
  const event = playback.event;
  const official = state.stage === 'complete' && event?.type === 'winner';
  useEffect(() => {
    if (!official) return;
    let active = true;
    void verifyAuditDocument(audit).then((result) => {
      if (active) setVerification(result);
    });
    return () => {
      active = false;
    };
  }, [audit, official]);
  const enterShowMode = async () => {
    setShowMode(true);
    try {
      await showRef.current?.requestFullscreen?.();
    } catch {
      // Show mode still works when fullscreen is blocked by browser policy.
    }
  };
  useEffect(() => {
    if (!showMode) return;
    let timer = window.setTimeout(() => setCursorHidden(true), 1800);
    const wakeCursor = () => {
      setCursorHidden(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setCursorHidden(true), 1800);
    };
    window.addEventListener('mousemove', wakeCursor);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', wakeCursor);
    };
  }, [showMode]);
  useEffect(() => {
    const handleKey = (keyboardEvent: KeyboardEvent) => {
      const target = keyboardEvent.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, button')) return;
      const key = keyboardEvent.key.toLowerCase();
      if (key === 'escape') setShowMode(false);
      if (keyboardEvent.code === 'Space') {
        keyboardEvent.preventDefault();
        playback.togglePause();
      } else if (key === 'n') playback.nextPhase();
      else if (key === 's') playback.skip();
      else if (key === 'm') audioManager.toggleMuted();
      else if (key === 'f') void enterShowMode();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });
  const durationMs = playback.duration;
  const isPlaying = state.stage === 'intro' || state.stage === 'event';
  const phaseLabels = {
    'phase-1': 'PHASE I — THE PURGE',
    'phase-2': 'PHASE II — CHAOS AWAKENS',
    'phase-3': 'PHASE III — SURVIVAL',
    'phase-4': 'PHASE IV — FINAL FIVE',
    'phase-5': 'PHASE V — FINAL FATE',
    final: 'FINAL — LAST CAPSULE',
  } as const;
  return (
    <section
      ref={showRef}
      className={styles.show}
      aria-label="Live giveaway"
      data-phase={event?.phase ?? 'intro'}
      data-show-mode={showMode}
      data-cursor-hidden={cursorHidden}
      data-reduced-motion={session.lock.payload.config.reducedMotion}
      onContextMenu={showMode ? (contextEvent) => contextEvent.preventDefault() : undefined}
    >
      <div className={styles.hud}>
        <div>
          <span className={styles.title}>{title}</span>
          <h2>
            {state.stage === 'intro'
              ? 'OPENING CEREMONY'
              : event
                ? phaseLabels[event.phase]
                : 'CAPSULE CHAOS'}
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
        {event &&
          session.lock.payload.config.showFullSurvivorBoard &&
          (event.phase === 'phase-2' || event.phase === 'phase-3') && (
            <SurvivorBoard
              players={event.snapshot}
              entries={session.lock.payload.entries}
              currentPlayerIds={event.participants}
            />
          )}
        <div className={styles.machine}>
          <GachaponMachine
            key={event?.id ?? 'intro'}
            spinning={event?.type === 'capsule-spin' && !state.settled}
          />
        </div>
        <div key={event?.id ?? state.stage} className={styles.presentation}>
          {event?.type === 'winner' ? (
            <WinnerScreen
              winner={audit.officialWinner}
              official={official}
              verification={verification}
            />
          ) : state.stage === 'intro' ? (
            <div className={styles.intro}>
              <p>THE ENTRIES ARE SEALED</p>
              <h1>GAME LOCKED</h1>
              <strong>{session.publicLock.entryCount} PLAYERS · 1 WINNER</strong>
              <p>The Purge begins automatically.</p>
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
        {official && <AuditPanel audit={audit} verification={verification} />}
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
            disabled={state.stage === 'complete'}
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
          <button className="button buttonSecondary" onClick={() => audioManager.toggleMuted()}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button className="button buttonSecondary" onClick={() => void enterShowMode()}>
            Enter Show Mode
          </button>
          <button className={styles.resetButton} onClick={() => setResetOpen(true)}>
            Emergency Reset
          </button>
        </div>
      </footer>
      {resetOpen && (
        <div
          className={styles.resetDialog}
          role="dialog"
          aria-modal="true"
          aria-label="Emergency reset"
        >
          <div>
            <h3>Abandon this live giveaway?</h3>
            <p>This removes recovery data. It is not a reroll. Type RESET to confirm.</p>
            <input
              autoFocus
              value={resetText}
              onChange={(changeEvent) => setResetText(changeEvent.target.value)}
              aria-label="Type RESET to confirm"
            />
            <div>
              <button className="button buttonSecondary" onClick={() => setResetOpen(false)}>
                Cancel
              </button>
              <button
                className="button buttonPrimary"
                disabled={resetText !== 'RESET'}
                onClick={onEmergencyReset}
              >
                Abandon session
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
