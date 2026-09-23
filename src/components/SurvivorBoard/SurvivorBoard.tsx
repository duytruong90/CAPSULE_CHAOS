import { memo, useMemo } from 'react';
import type { LockedEntry } from '../../game/engine/commitment';
import type { PlayerStatusSnapshot } from '../../game/state/gameTypes';
import styles from './SurvivorBoard.module.css';
import { AssetImage } from '../AssetMedia/AssetImage';

export const SurvivorBoard = memo(function SurvivorBoard({
  players,
  entries,
  currentPlayerIds,
}: {
  players: readonly PlayerStatusSnapshot[];
  entries: readonly LockedEntry[];
  currentPlayerIds: readonly string[];
}) {
  const current = useMemo(() => new Set(currentPlayerIds), [currentPlayerIds]);
  const visible = useMemo(
    () => players.filter((player) => player.state !== 'eliminated' || current.has(player.id)),
    [current, players],
  );
  const names = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry.displayName])),
    [entries],
  );
  const nameFor = (id: string) => names.get(id) ?? id;
  return (
    <aside className={styles.board} data-large={visible.length <= 10} aria-label="Survivor board">
      {visible.map((player) => {
        const protectedPlayer = player.shieldCharges + player.secondLifeCharges > 0;
        const locked = Boolean(player.lockedUntilPhase);
        const status =
          player.state === 'eliminated'
            ? 'ELIMINATED'
            : locked
              ? 'PHASE LOCKED'
              : player.state === 'revived'
                ? 'RETURNED'
                : protectedPlayer
                  ? 'PROTECTED'
                  : current.has(player.id)
                    ? 'IN PLAY'
                    : 'ACTIVE';
        return (
          <div
            key={player.id}
            className={styles.tile}
            data-state={player.state}
            data-current={current.has(player.id)}
          >
            <strong title={nameFor(player.id)}>{nameFor(player.id)}</strong>
            <span>{status}</span>
            <div className={styles.tokens} aria-label={`Status: ${status}`}>
              {player.shieldCharges > 0 && (
                <i title="Shield">
                  <AssetImage assetId="icon_shield" /> SHIELD {player.shieldCharges}
                </i>
              )}
              {player.secondLifeCharges > 0 && (
                <i title="Second Life">
                  <AssetImage assetId="icon_second_life" /> LIFE {player.secondLifeCharges}
                </i>
              )}
              {locked && (
                <i title="Final Pass">
                  <AssetImage assetId="icon_final_pass" /> PASS
                </i>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
});
