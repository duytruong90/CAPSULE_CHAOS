import styles from './PlayerReveal.module.css';

export function PlayerReveal({
  name,
  label,
  tone = 'neutral',
}: {
  name: string;
  label: string;
  tone?: 'neutral' | 'danger' | 'safe';
}) {
  return (
    <div className={styles.reveal} data-tone={tone}>
      <p>{label}</p>
      <h2
        tabIndex={name.length > 200 ? 0 : undefined}
        className={name.length > 40 ? styles.longName : undefined}
      >
        {name}
      </h2>
    </div>
  );
}
