import type { CSSProperties } from 'react';
import { Capsule } from '../Capsule/Capsule';
import styles from './GachaponMachine.module.css';
import { AssetImage } from '../AssetMedia/AssetImage';

export function GachaponMachine({ spinning = false }: { spinning?: boolean }) {
  return (
    <div
      className={styles.machine}
      data-spinning={spinning}
      aria-label="Gachapon machine"
      role="img"
    >
      <AssetImage className={styles.assetLayer} assetId="gachapon_base" alt="" />
      <AssetImage className={styles.assetLayer} assetId="gachapon_glass" alt="" />
      <AssetImage className={styles.assetLayer} assetId="gachapon_chute" alt="" />
      <div className={styles.cap}>CAPSULE CHAOS</div>
      <div className={styles.bowl}>
        <div className={styles.swirl}>
          {Array.from({ length: 18 }, (_, i) => (
            <div
              key={i}
              className={styles.ball}
              style={
                {
                  '--i': i,
                  left: `${12 + ((i * 23) % 66)}%`,
                  top: `${12 + ((i * 31) % 62)}%`,
                  transform: `rotate(${i * 37}deg)`,
                  filter: `hue-rotate(${i * 43}deg)`,
                } as CSSProperties
              }
            >
              <Capsule />
            </div>
          ))}
        </div>
        <div className={styles.reflection} />
      </div>
      <div className={styles.base}>
        <div className={styles.dial}>✦</div>
        <div className={styles.chute} />
        <p>FATE IS SEALED</p>
      </div>
    </div>
  );
}
