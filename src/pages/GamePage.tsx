import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../app/useAppState';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import styles from './GamePage.module.css';
import { BreakoutLiveShow } from '../presentation/breakout/BreakoutLiveShow';

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
    storageStatus,
  } = useAppState();

  return (
    <GameStage label="Capsule Chaos game screen">
      {gameSession && playback ? (
        <BreakoutLiveShow
          session={gameSession}
          playback={playback}
          title={setupDraft.giveawayName}
          storageStatus={storageStatus}
          onEmergencyReset={() => {
            resetGame();
            void navigate('/setup');
          }}
        />
      ) : (
        <div className={styles.page}>
          <AppChrome />
          {recoveryAvailable ? (
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
              <p className="eyebrow">Breakout stage standing by</p>
              <h1>GAME STAGE</h1>
              <p>Build a roster and lock all three acts before opening the live stage.</p>
              <Link className="button buttonSecondary" to="/setup">
                Return to setup
              </Link>
            </section>
          )}
        </div>
      )}
    </GameStage>
  );
}
