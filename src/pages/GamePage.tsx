import { Link } from 'react-router-dom';
import { useAppState } from '../app/useAppState';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import styles from './GamePage.module.css';
import { GameShow } from '../presentation/GameShow';

export function GamePage() {
  const { gameSession, playback, setupDraft } = useAppState();

  return (
    <GameStage label="Capsule Chaos game screen">
      <div className={styles.page}>
        <AppChrome />
        {gameSession && playback ? (
          <GameShow session={gameSession} playback={playback} title={setupDraft.giveawayName} />
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
