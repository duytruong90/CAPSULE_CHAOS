import { BREAKOUT_RULES } from './config';
import { simulateFaultline } from './faultline';
import type {
  BreakoutActState,
  BreakoutEngineEvent,
  BreakoutEngineEventFor,
  BreakoutEngineEventType,
  BreakoutEntry,
  BreakoutEventPayloadByType,
  BreakoutSnapshot,
  BreakoutStatus,
  FaultlineActResult,
  FaultlineSectors,
  FaultlineViewState,
} from './types';

const EMPTY_SECTORS: FaultlineSectors = Object.freeze([
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
  Object.freeze([]),
]);

function validateEntries(entries: readonly BreakoutEntry[]) {
  if (entries.length === 0) {
    throw new Error('Breakout requires at least one entry.');
  }

  const ids = new Set<string>();
  const indexes = new Set<number>();
  entries.forEach((entry) => {
    if (!entry.id || ids.has(entry.id))
      throw new Error('Breakout entry IDs must be non-empty and unique.');
    if (!Number.isInteger(entry.entryIndex) || indexes.has(entry.entryIndex)) {
      throw new Error('Breakout entry indexes must be unique integers.');
    }
    ids.add(entry.id);
    indexes.add(entry.entryIndex);
  });
}

function freezeActState(state: FaultlineViewState): FaultlineViewState {
  return Object.freeze({
    ...state,
    sectors: state.sectors,
    collapsingSectorIds: Object.freeze([...state.collapsingSectorIds]),
    eliminatedIds: Object.freeze([...state.eliminatedIds]),
    survivorIds: Object.freeze([...state.survivorIds]),
  });
}

function createSnapshot(
  canonicalIds: readonly string[],
  statusById: Readonly<Record<string, BreakoutStatus>>,
  currentActState: BreakoutActState,
): BreakoutSnapshot {
  const frozenStatuses = Object.freeze({ ...statusById });
  return Object.freeze({
    statusById: frozenStatuses,
    eligibleIds: Object.freeze(canonicalIds.filter((id) => frozenStatuses[id] !== 'eliminated')),
    currentActState,
  });
}

function assertParticipants(participants: readonly string[]) {
  if (new Set(participants).size !== participants.length) {
    throw new Error('Breakout event participants must be unique.');
  }
}

/**
 * Builds the complete Act 1 engine record without selecting a placeholder
 * winner. The production show stays on V3 until Escape Run and Final Clash
 * can extend this same event stream.
 */
export function simulateFaultlineAct(
  entries: readonly BreakoutEntry[],
  floorSeed: string,
  publicCommitment: string,
): FaultlineActResult {
  validateEntries(entries);
  const canonicalEntries = Object.freeze(
    [...entries]
      .sort((left, right) => left.entryIndex - right.entryIndex)
      .map((entry) => Object.freeze({ ...entry })),
  );
  const canonicalIds = Object.freeze(canonicalEntries.map((entry) => entry.id));
  const statuses: Record<string, BreakoutStatus> = Object.fromEntries(
    canonicalIds.map((id) => [id, 'active' as const]),
  );
  const initialActState = freezeActState({
    kind: 'faultline',
    waveIndex: 0,
    sectors: EMPTY_SECTORS,
    collapsingSectorIds: Object.freeze([]),
    rotationSteps: 0,
    eliminatedIds: Object.freeze([]),
    survivorIds: canonicalIds,
    complete: false,
  });
  let snapshot = createSnapshot(canonicalIds, statuses, initialActState);
  const events: BreakoutEngineEvent[] = [];

  const append = <Type extends BreakoutEngineEventType>(
    type: Type,
    participants: readonly string[],
    payload: BreakoutEventPayloadByType[Type],
    before: BreakoutSnapshot,
    after: BreakoutSnapshot,
  ) => {
    assertParticipants(participants);
    const sequence = events.length;
    const event = Object.freeze({
      id: `breakout-event-${String(sequence + 1).padStart(4, '0')}`,
      sequence,
      act: 'act-1' as const,
      type,
      participants: Object.freeze([...participants]),
      payload: Object.freeze({ ...payload }),
      before,
      after,
    }) as BreakoutEngineEventFor<Type>;
    events.push(event as BreakoutEngineEvent);
  };

  append(
    'show.locked',
    canonicalIds,
    { rosterCount: canonicalIds.length, publicCommitment },
    snapshot,
    snapshot,
  );

  const faultline = simulateFaultline(canonicalIds, floorSeed);
  if (faultline.waves.length === 0) {
    append(
      'act.skipped',
      canonicalIds,
      { reason: 'field-already-small', inputIds: canonicalIds, destination: 'act-2' },
      snapshot,
      snapshot,
    );
    return Object.freeze({
      entries: canonicalEntries,
      survivorIds: faultline.survivorIds,
      waves: faultline.waves,
      events: Object.freeze(events),
    });
  }

  append(
    'act.started',
    canonicalIds,
    { actId: 'act-1', inputIds: canonicalIds },
    snapshot,
    snapshot,
  );

  faultline.waves.forEach((wave) => {
    const beforeState = freezeActState({
      kind: 'faultline',
      waveIndex: wave.waveIndex,
      sectors: wave.sectorsBefore,
      collapsingSectorIds: wave.collapsingSectorIds,
      rotationSteps: wave.rotationSteps,
      eliminatedIds: Object.freeze([]),
      survivorIds: wave.inputIds,
      complete: false,
    });
    const before = createSnapshot(canonicalIds, statuses, beforeState);

    wave.eliminatedIds.forEach((id) => {
      statuses[id] = 'eliminated';
    });
    const afterState = freezeActState({
      kind: 'faultline',
      waveIndex: wave.waveIndex,
      sectors: wave.sectorsAfterShift,
      collapsingSectorIds: wave.collapsingSectorIds,
      rotationSteps: wave.rotationSteps,
      eliminatedIds: wave.eliminatedIds,
      survivorIds: wave.survivorIds,
      complete: false,
    });
    const after = createSnapshot(canonicalIds, statuses, afterState);
    append('faultline.wave-resolved', wave.inputIds, { wave }, before, after);
    snapshot = after;
  });

  const finalState = snapshot.currentActState;
  if (finalState.kind !== 'faultline') throw new Error('Faultline act ended in an invalid state.');
  const completedSnapshot = createSnapshot(
    canonicalIds,
    statuses,
    freezeActState({ ...finalState, complete: true }),
  );
  append(
    'act.completed',
    faultline.survivorIds,
    { actId: 'act-1', outputIds: faultline.survivorIds },
    snapshot,
    completedSnapshot,
  );

  if (
    faultline.survivorIds.length < 8 ||
    faultline.survivorIds.length > BREAKOUT_RULES.floorMaxSurvivors
  ) {
    throw new Error('Faultline must hand 8–16 survivors to Escape Run.');
  }

  return Object.freeze({
    entries: canonicalEntries,
    survivorIds: faultline.survivorIds,
    waves: faultline.waves,
    events: Object.freeze(events),
  });
}
