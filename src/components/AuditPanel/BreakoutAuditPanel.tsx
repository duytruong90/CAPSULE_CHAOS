import { useState } from 'react';
import {
  createBreakoutAuditFilename,
  serializeBreakoutAuditDocument,
  type BreakoutAuditDocument,
  type BreakoutAuditVerification,
} from '../../game/breakout/audit';
import styles from './BreakoutAuditPanel.module.css';

export function BreakoutAuditPanel({
  audit,
  verification,
}: {
  audit: BreakoutAuditDocument;
  verification: BreakoutAuditVerification | null;
}) {
  const [open, setOpen] = useState(false);
  const json = serializeBreakoutAuditDocument(audit);
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createBreakoutAuditFilename(audit);
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <aside className={styles.panel} aria-label="Breakout audit">
      <div className={styles.status} data-verified={verification?.verified ?? false}>
        {verification === null
          ? 'VERIFYING COMPLETE SHOW…'
          : verification.verified
            ? 'COMPLETE SHOW VERIFIED'
            : 'VERIFICATION FAILED'}
      </div>
      <div className={styles.details}>
        <span>REVEALED MASTER SEED</span>
        <code>{audit.lockPayload.seed}</code>
        <span>SHA-256</span>
        <code>{audit.commitmentHash}</code>
      </div>
      <div className={styles.actions}>
        <button className="button buttonSecondary" onClick={() => setOpen((value) => !value)}>
          {open ? 'Hide audit JSON' : 'View audit JSON'}
        </button>
        <button className="button buttonPrimary" onClick={download}>
          Download audit JSON
        </button>
      </div>
      {open && <textarea aria-label="Breakout audit JSON" readOnly value={json} />}
    </aside>
  );
}
