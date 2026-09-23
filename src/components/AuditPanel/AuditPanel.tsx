import { useState } from 'react';
import {
  createAuditFilename,
  serializeAuditDocument,
  type AuditDocument,
  type AuditVerification,
} from '../../game/audit/audit';
import styles from './AuditPanel.module.css';

export function AuditPanel({
  audit,
  verification,
}: {
  audit: AuditDocument;
  verification: AuditVerification | null;
}) {
  const [open, setOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const json = serializeAuditDocument(audit);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus('Audit JSON copied.');
    } catch {
      setCopyStatus('Copy failed. Use View Audit Log to copy manually.');
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createAuditFilename(audit);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.audit} aria-label="Giveaway audit">
      <div className={styles.status} data-verified={verification?.verified ?? false}>
        <span>
          {verification === null
            ? 'VERIFYING RESULT…'
            : verification.verified
              ? 'RESULT VERIFIED'
              : 'VERIFICATION FAILED'}
        </span>
        <code>{audit.commitmentHash}</code>
      </div>
      <div className={styles.seed}>
        <span>REVEALED SEED</span>
        <code>{audit.lockPayload.seed}</code>
      </div>
      <div className={styles.actions}>
        <button className="button buttonSecondary" onClick={() => setOpen((value) => !value)}>
          {open ? 'Hide Audit Log' : 'View Audit Log'}
        </button>
        <button className="button buttonSecondary" onClick={() => void copy()}>
          Copy audit JSON
        </button>
        <button className="button buttonPrimary" onClick={download}>
          Download audit JSON
        </button>
      </div>
      {copyStatus && <p role="status">{copyStatus}</p>}
      {open && <textarea aria-label="Audit JSON" readOnly value={json} />}
    </section>
  );
}
