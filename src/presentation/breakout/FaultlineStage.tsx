import { useMemo } from 'react';
import { AssetImage } from '../../components/AssetMedia/AssetImage';
import { getFaultlineTiming } from '../../game/breakout/buildBreakoutTimeline';
import { FAULTLINE_NAMES_PER_PAGE, FAULTLINE_SECTOR_LABELS } from '../../game/breakout/config';
import type {
  BreakoutEngineEvent,
  BreakoutEntry,
  FaultlineSectors,
  SectorId,
} from '../../game/breakout/types';
import styles from './FaultlineStage.module.css';

type FaultlineWaveEvent = Extract<BreakoutEngineEvent, { type: 'faultline.wave-resolved' }>;

interface FaultlineStageProps {
  entries: readonly BreakoutEntry[];
  event: FaultlineWaveEvent;
  elapsedBaseMs: number;
  reducedMotion?: boolean;
}

function eventPhase(elapsed: number, timing: ReturnType<typeof getFaultlineTiming>) {
  if (elapsed < timing.assignmentEnd) return 'assignment';
  if (elapsed < timing.warningStart) return 'scanning';
  if (elapsed < timing.shiftStart) return 'warning';
  if (elapsed < timing.braceStart) return 'shift';
  if (elapsed < timing.collapseStart) return 'brace';
  if (elapsed < timing.resolution) return 'collapse';
  if (elapsed < timing.resultEnd) return 'result';
  return 'survivors';
}

export function FaultlineStage({
  entries,
  event,
  elapsedBaseMs,
  reducedMotion = false,
}: FaultlineStageProps) {
  const wave = event.payload.wave;
  const timing = getFaultlineTiming(event);
  const phase = eventPhase(elapsedBaseMs, timing);
  const nameById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const movementMidpoint = timing.shiftStart + 1_500;
  const afterMovement = wave.rotationSteps !== 0 && elapsedBaseMs >= movementMidpoint;
  const sectors: FaultlineSectors = afterMovement ? wave.sectorsAfterShift : wave.sectorsBefore;
  const resolved = elapsedBaseMs >= timing.resolution;
  const pageIndex = Math.min(
    Math.floor(Math.min(elapsedBaseMs, timing.assignmentEnd - 1) / 3_000),
    timing.maxSectorPageCount - 1,
  );
  const collapsing = new Set<SectorId>(wave.collapsingSectorIds);
  const direction = wave.rotationSteps === 1 ? 'CLOCKWISE' : 'COUNTERCLOCKWISE';
  const copy = {
    assignment: 'FIND YOUR SECTOR.',
    scanning: 'SCANNING',
    warning: 'TWO SECTORS WILL FALL.',
    shift: 'CONVEYOR SHIFT — FOLLOW YOUR CAPSULE',
    brace: 'BRACE.',
    collapse: 'PLATFORMS DROPPING',
    result: `${wave.eliminatedIds.length} OUT · ${wave.survivorIds.length} REMAIN`,
    survivors: `${wave.survivorIds.length} SURVIVORS`,
  }[phase];

  return (
    <section
      className={styles.stage}
      data-phase={phase}
      data-reduced-motion={reducedMotion}
      aria-label={`Faultline wave ${wave.waveIndex}`}
    >
      <AssetImage className={styles.background} assetId="bg_faultline" alt="" />
      <header className={styles.header}>
        <div>
          <p>ACT 1 · FAULTLINE</p>
          <h1>WAVE {wave.waveIndex}</h1>
        </div>
        <div className={styles.counter}>
          <strong>{resolved ? wave.survivorIds.length : wave.inputIds.length}</strong>
          <span>{resolved ? 'REMAIN' : 'IN THE REACTOR'}</span>
        </div>
      </header>

      <div className={styles.floor}>
        <div className={styles.shaft} aria-hidden="true" />
        <div className={styles.connector} aria-hidden="true">
          ↻
        </div>
        {([0, 1, 2, 3] as const).map((sectorId) => {
          const occupants = sectors[sectorId];
          const ownPageCount = Math.max(1, Math.ceil(occupants.length / FAULTLINE_NAMES_PER_PAGE));
          const shownPage = Math.min(pageIndex, ownPageCount - 1);
          const visible = occupants.slice(
            shownPage * FAULTLINE_NAMES_PER_PAGE,
            (shownPage + 1) * FAULTLINE_NAMES_PER_PAGE,
          );
          const isDanger = collapsing.has(sectorId) && elapsedBaseMs >= timing.warningStart;
          const isDropped = isDanger && elapsedBaseMs >= timing.collapseStart;
          const state = isDropped
            ? 'DROPPED'
            : isDanger
              ? 'DANGER'
              : phase === 'scanning'
                ? 'SCANNING'
                : 'STABLE';

          return (
            <article
              className={`${styles.sector} ${styles[`sector${FAULTLINE_SECTOR_LABELS[sectorId]}`]}`}
              data-state={state.toLowerCase()}
              key={sectorId}
            >
              <div className={styles.sectorHeader}>
                <span className={styles.sectorLetter}>{FAULTLINE_SECTOR_LABELS[sectorId]}</span>
                <strong>{occupants.length} CAPSULES</strong>
                <span className={styles.sectorState}>{state}</span>
              </div>
              {isDanger && (
                <AssetImage className={styles.cracks} assetId="fx_floor_cracks" alt="" />
              )}
              {isDropped && <AssetImage className={styles.dust} assetId="fx_floor_dust" alt="" />}
              <div className={styles.occupants}>
                {visible.map((id) => {
                  const entry = nameById.get(id);
                  const color = ['red', 'blue', 'green', 'gold'][(entry?.entryIndex ?? 0) % 4] as
                    'red' | 'blue' | 'green' | 'gold';
                  return (
                    <div className={styles.occupant} key={id} aria-label={entry?.displayName ?? id}>
                      <AssetImage assetId={`capsule_${color}`} alt="" />
                      <span title={entry?.displayName ?? id}>{entry?.displayName ?? id}</span>
                    </div>
                  );
                })}
              </div>
              {ownPageCount > 1 && phase === 'assignment' && (
                <span className={styles.pageCount}>
                  PAGE {shownPage + 1}/{ownPageCount}
                </span>
              )}
              {phase !== 'assignment' && occupants.length > FAULTLINE_NAMES_PER_PAGE && (
                <span className={styles.moreCount}>
                  +{occupants.length - visible.length} IN THIS SECTOR
                </span>
              )}
            </article>
          );
        })}
      </div>

      {phase === 'shift' && (
        <div className={styles.shiftBanner}>
          <AssetImage assetId="icon_conveyor" alt="" />
          <strong>
            {direction === 'CLOCKWISE' ? '↻' : '↺'} {direction}
          </strong>
        </div>
      )}

      <footer className={styles.caption} aria-live="polite">
        <strong>{copy}</strong>
        {phase === 'assignment' && (
          <span>
            Two sectors collapse each wave. If we reach wave two, the conveyor moves everyone before
            the drop.
          </span>
        )}
      </footer>
    </section>
  );
}
