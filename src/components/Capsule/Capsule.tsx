import styles from './Capsule.module.css';

export function Capsule({ open = false }: { open?: boolean }) {
  return (
    <div className={styles.capsule} data-open={open} aria-hidden="true">
      <span />
      <span />
    </div>
  );
}
