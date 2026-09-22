import { Link } from 'react-router-dom';
import { useAppState } from '../app/useAppState';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import styles from './GamePage.module.css';

export function GamePage() {
  const { gameSession } = useAppState();

  return (
    <GameStage label="Capsule Chaos game screen">
      <div className={styles.page}>
        <AppChrome />
        <div className={styles.hud}>
          <span>{gameSession ? 'Outcome precomputed' : 'Stage preview'}</span>
          <span>1920 × 1080 logical canvas</span>
        </div>

        {gameSession ? (
          <section className={styles.lockedArena}>
            <div className={styles.lockIcon} aria-hidden="true">
              <span />
            </div>
            <p className="eyebrow">Fairness commitment created</p>
            <h1>GAME LOCKED</h1>
            <p className={styles.lockDescription}>
              The complete baseline outcome and presentation timeline were generated before this
              screen appeared. The seed and winner remain hidden.
            </p>
            <div className={styles.commitmentPanel}>
              <span>SHA-256 commitment</span>
              <strong>{gameSession.publicLock.commitment.displayHash}</strong>
              <code>{gameSession.publicLock.commitment.fullHash}</code>
            </div>
            <div className={styles.lockStats}>
              <div>
                <strong>{gameSession.publicLock.entryCount}</strong>
                <span>Locked entries</span>
              </div>
              <div>
                <strong>{gameSession.simulation.events.length}</strong>
                <span>Engine events</span>
              </div>
              <div>
                <strong>{gameSession.timeline.events.length}</strong>
                <span>Timeline events</span>
              </div>
            </div>
            <p className={styles.phaseNotice}>Timeline playback arrives in Phase 06.</p>
          </section>
        ) : (
          <section className={styles.arena}>
            <div className={styles.ring} aria-hidden="true">
              <div className={styles.capsule} />
            </div>
            <p className="eyebrow">The machine is waiting</p>
            <h1>GAME STAGE</h1>
            <p>Build and validate a roster before locking the deterministic game.</p>
            <Link className="button buttonSecondary" to="/setup">
              Return to setup
            </Link>
          </section>
        )}

        <div className={styles.footer}>
          <span>Game engine</span>
          <i />
          <span>Timeline</span>
          <i />
          <span>Presentation</span>
        </div>
      </div>
    </GameStage>
  );
}
