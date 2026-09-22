import { Link, useLocation } from 'react-router-dom';
import { useAppState } from '../../app/useAppState';
import styles from './AppChrome.module.css';

export function AppChrome() {
  const { pathname } = useLocation();
  const { gameSession, setupDraft, updateSetupConfig } = useAppState();
  const { soundEnabled } = setupDraft.config;

  return (
    <header className={styles.header}>
      <Link className={styles.brand} to="/setup" aria-label="Capsule Chaos setup">
        <span className={styles.brandMark} aria-hidden="true" />
        <span>
          <strong>CAPSULE</strong>
          <b>CHAOS</b>
        </span>
      </Link>

      <div className={styles.status}>
        <span className={styles.statusDot} aria-hidden="true" />
        Purge live build
      </div>

      <nav className={styles.nav} aria-label="Primary navigation">
        <Link aria-current={pathname === '/setup' ? 'page' : undefined} to="/setup">
          Setup
        </Link>
        <Link aria-current={pathname === '/game' ? 'page' : undefined} to="/game">
          Stage
        </Link>
        <button
          type="button"
          className={styles.soundButton}
          aria-pressed={!soundEnabled}
          disabled={Boolean(gameSession)}
          onClick={() => updateSetupConfig({ soundEnabled: !soundEnabled })}
        >
          Sound {soundEnabled ? 'on' : 'off'}
        </button>
      </nav>
    </header>
  );
}
