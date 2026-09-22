import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { calculateFittedStage, LOGICAL_STAGE } from './stageSizing';
import styles from './GameStage.module.css';

interface GameStageProps {
  children: ReactNode;
  label: string;
}

function currentViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function GameStage({ children, label }: GameStageProps) {
  const [viewport, setViewport] = useState(currentViewport);

  useEffect(() => {
    const handleResize = () => setViewport(currentViewport());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fitted = calculateFittedStage(viewport, LOGICAL_STAGE);
  const frameStyle = {
    width: fitted.width,
    height: fitted.height,
  } satisfies CSSProperties;
  const canvasStyle = {
    width: LOGICAL_STAGE.width,
    height: LOGICAL_STAGE.height,
    transform: `scale(${fitted.scale})`,
  } satisfies CSSProperties;

  return (
    <div className={styles.viewport}>
      <div className={styles.frame} style={frameStyle}>
        <main className={styles.canvas} style={canvasStyle} aria-label={label}>
          {children}
        </main>
      </div>
    </div>
  );
}
