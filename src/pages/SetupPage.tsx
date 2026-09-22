import { Link } from 'react-router-dom';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import styles from './SetupPage.module.css';

export function SetupPage() {
  return (
    <GameStage label="Capsule Chaos setup screen">
      <div className={styles.page}>
        <AppChrome />
        <section className={styles.content}>
          <div className={styles.copy}>
            <p className="eyebrow">Giveaway control room</p>
            <h1>
              Load the names.
              <br />
              <span>Lock the chaos.</span>
            </h1>
            <p className={styles.intro}>
              A fair, deterministic giveaway built for one unforgettable screen-shared show. Setup
              controls arrive in Phase 02.
            </p>
            <div className={styles.actions}>
              <Link className="button buttonPrimary" to="/game">
                Preview game stage
              </Link>
              <span>Project skeleton ready</span>
            </div>
          </div>

          <div className={styles.panel} aria-label="Setup placeholder">
            <div className={styles.panelHeader}>
              <div>
                <p>New giveaway</p>
                <h2>Setup console</h2>
              </div>
              <span>Phase 01</span>
            </div>
            <div className={styles.field}>
              <span>Giveaway name</span>
              <strong>Configuration coming next</strong>
            </div>
            <div className={styles.dropzone}>
              <div className={styles.capsuleIcon} aria-hidden="true" />
              <h3>Entry import placeholder</h3>
              <p>
                Names, validation, and duplicate handling are intentionally reserved for Phase 02.
              </p>
            </div>
            <div className={styles.stats}>
              <div>
                <strong>16:9</strong>
                <span>Logical stage</span>
              </div>
              <div>
                <strong>1080p+</strong>
                <span>Screen-share ready</span>
              </div>
              <div>
                <strong>Locked</strong>
                <span>Outcome controls</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </GameStage>
  );
}
