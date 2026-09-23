import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../app/useAppState';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import styles from './GamePage.module.css';
import { GameShow } from '../presentation/GameShow';

export function GamePage() {
  const navigate = useNavigate();
  const {
    abandonSession,
    gameSession,
    playback,
    recoveryAvailable,
    resetGame,
    resumeGame,
    setupDraft,
  } = useAppState();

  return (
    <GameStage label="Capsule Chaos game screen">
      <div className={styles.page}>
        <AppChrome />
        {gameSession && playback ? (
          <GameShow
            session={gameSession}
            playback={playback}
            title={setupDraft.giveawayName}
            onEmergencyReset={() => {
              resetGame();
              void navigate('/setup');
            }}
          />
        ) : recoveryAvailable ? (
          <section className={styles.arena} aria-label="Active giveaway found">
            <p className="eyebrow">Recovery available</p>
            <h1>Active giveaway found</h1>
            <p>The locked seed, event sequence, finalists, and winner are ready to resume.</p>
            <button className="button buttonPrimary" onClick={resumeGame}>
              Resume giveaway
            </button>
            <button
              className="button buttonSecondary"
              onClick={() => {
                abandonSession();
                void navigate('/setup');
              }}
            >
              Abandon session
            </button>
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
      </div>
    </GameStage>
  );
}
