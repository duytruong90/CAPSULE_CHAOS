import { Link } from 'react-router-dom';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import styles from './GamePage.module.css';

export function GamePage() {
  return (
    <GameStage label="Capsule Chaos game screen">
      <div className={styles.page}>
        <AppChrome />
        <div className={styles.hud}>
          <span>Stage preview</span>
          <span>1920 × 1080 logical canvas</span>
        </div>

        <section className={styles.arena}>
          <div className={styles.ring} aria-hidden="true">
            <div className={styles.capsule} />
          </div>
          <p className="eyebrow">The machine is waiting</p>
          <h1>GAME STAGE</h1>
          <p>
            Gameplay and outcome generation are intentionally absent until their approved phases.
          </p>
          <Link className="button buttonSecondary" to="/setup">
            Return to setup
          </Link>
        </section>

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
