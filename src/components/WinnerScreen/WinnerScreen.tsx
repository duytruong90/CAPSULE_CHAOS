import type { LockedEntry } from '../../game/engine/commitment';
import type { AuditVerification } from '../../game/audit/audit';
import styles from './WinnerScreen.module.css';
import { AssetImage } from '../AssetMedia/AssetImage';

export function WinnerScreen({
  winner,
  official,
  verification,
}: {
  winner: LockedEntry;
  official: boolean;
  verification: AuditVerification | null;
}) {
  return (
    <section className={styles.winner} data-official={official} aria-label="Official winner">
      <div className={styles.rays} aria-hidden="true" />
      <AssetImage className={styles.goldCapsule} assetId="capsule_gold" alt="" />
      <div className={styles.crown} aria-hidden="true">
        ♛
      </div>
      <p>OFFICIAL WINNER</p>
      <h1>{winner.displayName}</h1>
      <strong>{official ? 'THE RESULT IS FINAL' : 'FINALIZING LOCKED RESULT…'}</strong>
      {official && verification?.verified && (
        <div className={styles.verified}>✓ RESULT VERIFIED</div>
      )}
      {official && verification && !verification.verified && (
        <div className={styles.failed} role="alert">
          VERIFICATION FAILED
        </div>
      )}
      <div className={styles.confetti} aria-hidden="true" />
    </section>
  );
}
