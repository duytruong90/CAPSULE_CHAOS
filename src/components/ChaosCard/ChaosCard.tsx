import type { CSSProperties } from 'react';
import type { CardRarity } from '../../game/cards/cardTypes';
import { cardPresentation } from '../../presentation/presentationRegistry';
import styles from './ChaosCard.module.css';
import { AssetImage } from '../AssetMedia/AssetImage';
import { cardAssetMap } from '../../assets/showAssets';

export interface ChaosCardProps {
  cardId: string;
  name: string;
  rarity: CardRarity;
  description: string;
  presentationKey: string;
  targetText: string;
  resultText: string;
  durationMs: number;
  settled?: boolean;
}

export function ChaosCard({
  cardId,
  name,
  rarity,
  description,
  presentationKey,
  targetText,
  resultText,
  durationMs,
  settled = false,
}: ChaosCardProps) {
  const presentation = cardPresentation(presentationKey, rarity);
  return (
    <section
      className={styles.scene}
      data-rarity={rarity}
      data-settled={settled}
      data-card-id={cardId}
      style={{ '--duration': `${durationMs}ms` } as CSSProperties}
      aria-label={`${presentation.label} Chaos Card`}
    >
      <div className={styles.burst} aria-hidden="true" />
      <div className={styles.particles} aria-hidden="true">
        ✦ · ✧ · ✦ · ✧
      </div>
      <div
        className={styles.card}
        tabIndex={name.length + description.length + targetText.length > 300 ? 0 : undefined}
      >
        <AssetImage assetId={`card_${rarity}_frame`} className={styles.frame} />
        <AssetImage assetId="card_back" className={styles.back} />
        <p className={styles.rarity}>{presentation.label} / CHAOS CARD</p>
        <div className={styles.symbol} aria-hidden="true">
          <span>{presentation.symbol}</span>
          {cardAssetMap[presentationKey] && (
            <AssetImage assetId={cardAssetMap[presentationKey].icon} />
          )}
        </div>
        <h2>{name}</h2>
        <p className={styles.description}>{description}</p>
        <p className={styles.target}>{targetText}</p>
        <strong className={styles.result}>{resultText}</strong>
      </div>
    </section>
  );
}
