import { useMemo, type CSSProperties } from 'react';
import { AssetImage } from '../../components/AssetMedia/AssetImage';
import { getRaceBeatTiming } from '../../game/breakout/buildBreakoutTimeline';
import { BREAKOUT_RULES } from '../../game/breakout/config';
import type {
  BreakoutEngineEvent,
  BreakoutEntry,
  Qualification,
  RaceMove,
} from '../../game/breakout/types';
import styles from './EscapeRunStage.module.css';

type RaceBeatEvent = Extract<BreakoutEngineEvent, { type: 'race.beat-resolved' }>;

interface EscapeRunStageProps {
  entries: readonly BreakoutEntry[];
  event: RaceBeatEvent;
  elapsedBaseMs: number;
  reducedMotion?: boolean;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function phaseFor(
  elapsed: number,
  timing: ReturnType<typeof getRaceBeatTiming>,
  hasPhotoFinish: boolean,
) {
  if (elapsed < timing.movementReveal) return 'charge';
  if (elapsed < timing.movementStart) return 'reveal';
  if (elapsed < timing.motionEnd) return 'movement';
  if (hasPhotoFinish && elapsed < timing.resolution) return 'photo';
  if (elapsed < timing.resolution) return 'settling';
  return 'result';
}

function lastExitLeaders(
  laneIds: readonly string[],
  activeIds: readonly string[],
  distanceById: Readonly<Record<string, number>>,
) {
  const active = laneIds
    .filter((id) => activeIds.includes(id))
    .sort(
      (left, right) =>
        (distanceById[right] as number) - (distanceById[left] as number) ||
        laneIds.indexOf(left) - laneIds.indexOf(right),
    );
  const leadingDistance = distanceById[active[0] ?? ''];
  const tiedLeaders = active.filter((id) => distanceById[id] === leadingDistance);
  return new Set(tiedLeaders.length > 2 ? tiedLeaders : active.slice(0, 2));
}

export function EscapeRunStage({
  entries,
  event,
  elapsedBaseMs,
  reducedMotion = false,
}: EscapeRunStageProps) {
  const beat = event.payload.beat;
  const timing = getRaceBeatTiming(event);
  const beforeState = event.before.currentActState;
  const afterState = event.after.currentActState;
  if (beforeState.kind !== 'race' || afterState.kind !== 'race') {
    throw new Error('Escape Run stage requires race snapshots.');
  }
  const nameById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((entry) =>
      counts.set(entry.normalizedName, (counts.get(entry.normalizedName) ?? 0) + 1),
    );
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name));
  }, [entries]);
  const moveById = new Map(beat.moves.map((move) => [move.playerId, move]));
  const resolved = elapsedBaseMs >= timing.resolution;
  const phase = phaseFor(elapsedBaseMs, timing, beat.cutoffTieIds.length > 0);
  const progress = reducedMotion
    ? elapsedBaseMs >= timing.motionEnd
      ? 1
      : 0
    : clamp((elapsedBaseMs - timing.movementStart) / timing.movementDuration, 0, 1);
  const qualifications = resolved ? afterState.qualifications : beforeState.qualifications;
  const qualificationBySlot = new Map(qualifications.map((item) => [item.slot, item]));
  const activeIds = beforeState.laneIds.filter((id) => event.before.statusById[id] === 'active');
  const oneExitLeft = beforeState.qualifications.length === 3;
  const emphasized = oneExitLeft
    ? lastExitLeaders(beforeState.laneIds, activeIds, beforeState.distanceById)
    : new Set<string>();
  const photoOrderRevealed = elapsedBaseMs >= timing.photoReveal;
  const photoAwarded = new Set(beat.cutoffTiePriorityIds.slice(0, beat.tieSlotsAvailable));

  const displayName = (id: string) => {
    const entry = nameById.get(id);
    if (!entry) return id;
    return duplicateNames.has(entry.normalizedName)
      ? `${entry.displayName} · TICKET ${entry.entryIndex + 1}`
      : entry.displayName;
  };

  const transientGate = (slot: 1 | 2 | 3 | 4): Qualification | 'photo' | undefined => {
    if (resolved || qualificationBySlot.has(slot)) return undefined;
    const candidate = beat.newlyQualified.find((item) => item.slot === slot);
    if (!candidate) return undefined;
    if (beat.cutoffTieIds.includes(candidate.playerId)) {
      if (elapsedBaseMs < timing.motionEnd) return undefined;
      return photoOrderRevealed ? candidate : 'photo';
    }
    const crossingTime =
      timing.movementStart +
      (candidate.crossing.remaining / candidate.crossing.movement) * timing.movementDuration;
    return elapsedBaseMs >= crossingTime ? candidate : undefined;
  };

  const positionFor = (id: string, move: RaceMove | undefined) => {
    const distance = move
      ? move.from + move.movement * progress
      : (beforeState.distanceById[id] as number);
    return clamp(distance, 0, BREAKOUT_RULES.raceFinishDistance);
  };

  return (
    <section
      className={styles.stage}
      data-phase={phase}
      data-reduced-motion={reducedMotion}
      aria-label={`Escape Run beat ${beat.beatIndex}`}
    >
      <AssetImage className={styles.background} assetId="bg_escape_run" alt="" />
      <header className={styles.header}>
        <div>
          <p>ACT 2 · ESCAPE RUN</p>
          <h1>BEAT {beat.beatIndex}</h1>
        </div>
        <div className={styles.objective}>
          <AssetImage assetId="icon_exit" alt="" />
          <strong>{4 - beforeState.qualifications.length}</strong>
          <span>{oneExitLeft ? 'ONE EXIT LEFT' : 'EXITS OPEN'}</span>
        </div>
      </header>

      <div
        className={styles.lanes}
        style={{ '--lane-count': beforeState.laneIds.length } as CSSProperties}
      >
        {beforeState.laneIds.map((id, laneIndex) => {
          const entry = nameById.get(id);
          const move = moveById.get(id);
          const priorQualification = beforeState.qualifications.find(
            (item) => item.playerId === id,
          );
          const currentQualification = qualifications.find((item) => item.playerId === id);
          const position = currentQualification ? 9 : positionFor(id, move);
          const color = ['red', 'blue', 'green', 'gold'][laneIndex % 4] as
            'red' | 'blue' | 'green' | 'gold';
          const laneStyle = {
            '--capsule-position': `${(position / 9) * 100}%`,
          } as CSSProperties;
          return (
            <div
              className={styles.lane}
              data-emphasized={emphasized.has(id)}
              data-qualified={Boolean(currentQualification)}
              key={id}
            >
              <div className={styles.name} title={entry?.displayName ?? id}>
                <strong>{displayName(id)}</strong>
                <span>
                  {currentQualification
                    ? `ESCAPED · SLOT ${currentQualification.slot}`
                    : `DISTANCE ${Math.floor(position * 10) / 10}`}
                </span>
              </div>
              <div className={styles.track}>
                {[0, 3, 6, 9].map((tick) => (
                  <span className={styles.tick} style={{ left: `${(tick / 9) * 100}%` }} key={tick}>
                    {tick}
                  </span>
                ))}
                <div className={styles.rail} />
                <div className={styles.capsule} style={laneStyle}>
                  {move &&
                    elapsedBaseMs >= timing.movementStart &&
                    elapsedBaseMs < timing.motionEnd && (
                      <AssetImage
                        className={styles.exhaust}
                        data-movement={move.movement}
                        assetId="fx_capsule_exhaust"
                        alt=""
                      />
                    )}
                  <AssetImage assetId={`capsule_${color}`} alt="" />
                </div>
                {move && elapsedBaseMs >= timing.movementReveal && (
                  <span className={styles.movement} style={laneStyle}>
                    +{move.movement}
                    {move.movement === 3 && <AssetImage assetId="icon_burst" alt="" />}
                  </span>
                )}
              </div>
              {priorQualification && (
                <span className={styles.parked}>SLOT {priorQualification.slot}</span>
              )}
            </div>
          );
        })}
      </div>

      <aside className={styles.gates} aria-label="Escape slots">
        {[1, 2, 3, 4].map((slotNumber) => {
          const slot = slotNumber as 1 | 2 | 3 | 4;
          const official = qualificationBySlot.get(slot);
          const transient = transientGate(slot);
          const gateState = official
            ? 'QUALIFIED'
            : transient === 'photo'
              ? 'PHOTO FINISH'
              : transient
                ? 'RESOLVING'
                : 'OPEN';
          const gateName = official
            ? displayName(official.playerId)
            : transient && transient !== 'photo'
              ? displayName(transient.playerId)
              : '';
          return (
            <div
              className={styles.gate}
              data-state={gateState.toLowerCase().replace(' ', '-')}
              key={slot}
            >
              <AssetImage assetId="img_exit_gate" alt="" />
              <strong>{slot}</strong>
              <span>{gateName || gateState}</span>
            </div>
          );
        })}
      </aside>

      {phase === 'photo' && (
        <div className={styles.photoPanel}>
          <AssetImage assetId="icon_photo_finish" alt="" />
          <div>
            <strong>EXACT TIE — LOCKED PHOTO ORDER</strong>
            <span>
              {beat.tieSlotsAvailable} {beat.tieSlotsAvailable === 1 ? 'PLACE' : 'PLACES'}
            </span>
          </div>
          <ol>
            {(photoOrderRevealed ? beat.cutoffTiePriorityIds : beat.cutoffTieIds).map((id) => (
              <li key={id} data-awarded={photoOrderRevealed && photoAwarded.has(id)}>
                {displayName(id)}
                {photoOrderRevealed && (
                  <small>{photoAwarded.has(id) ? ' SLOT AWARDED' : ' OUT'}</small>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <footer className={styles.caption} aria-live="polite">
        <strong>
          {resolved && beat.raceComplete
            ? 'FOUR ESCAPED.'
            : oneExitLeft
              ? 'ONE EXIT LEFT.'
              : `${4 - beforeState.qualifications.length} EXITS OPEN.`}
        </strong>
        <span>
          {phase === 'charge'
            ? 'ENGINES ARMING'
            : phase === 'reveal'
              ? 'MOVEMENT LOCKED'
              : phase === 'movement'
                ? 'EVERYONE MOVES TOGETHER'
                : resolved
                  ? `${afterState.qualifications.length} EXITS FILLED`
                  : 'RESOLVING ARRIVALS'}
        </span>
      </footer>
    </section>
  );
}
