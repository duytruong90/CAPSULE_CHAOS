import { BREAKOUT_RULES } from './config';
import { simulateFaultline } from './faultline';
import { simulateEscapeRun } from './escapeRun';
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
  EscapeRunActResult,
  RaceViewState,
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

function freezeRaceState(state: RaceViewState): RaceViewState {
  return Object.freeze({
    ...state,
    laneIds: Object.freeze([...state.laneIds]),
    distanceById: Object.freeze({ ...state.distanceById }),
    qualifications: Object.freeze([...state.qualifications]),
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

/**
 * Builds the complete Act 2 engine record without selecting a final winner.
 * Input IDs are canonicalized by the locked roster's entry indexes.
 */
export function simulateEscapeRunAct(
  entries: readonly BreakoutEntry[],
  inputIds: readonly string[],
  deckSeed: string,
  photoSeed: string,
  startSequence = 0,
): EscapeRunActResult {
  validateEntries(entries);
  if (!Number.isInteger(startSequence) || startSequence < 0) {
    throw new RangeError('Breakout event sequence offset must be a non-negative integer.');
  }
  const canonicalEntries = Object.freeze(
    [...entries]
      .sort((left, right) => left.entryIndex - right.entryIndex)
      .map((entry) => Object.freeze({ ...entry })),
  );
  const canonicalIds = Object.freeze(canonicalEntries.map((entry) => entry.id));
  const inputIdSet = new Set(inputIds);
  if (inputIdSet.size !== inputIds.length || inputIds.some((id) => !canonicalIds.includes(id))) {
    throw new Error('Escape Run input must contain unique IDs from the locked roster.');
  }
  const laneIds = Object.freeze(canonicalIds.filter((id) => inputIdSet.has(id)));
  const statuses: Record<string, BreakoutStatus> = Object.fromEntries(
    canonicalIds.map((id) => [id, inputIdSet.has(id) ? 'active' : 'eliminated']),
  );
  const initialDistances = Object.freeze(
    Object.fromEntries(laneIds.map((id) => [id, 0])) as Record<string, number>,
  );
  const initialState = freezeRaceState({
    kind: 'race',
    laneIds,
    distanceById: initialDistances,
    qualifications: Object.freeze([]),
    beatIndex: 0,
    complete: false,
  });
  let snapshot = createSnapshot(canonicalIds, statuses, initialState);
  const events: BreakoutEngineEvent[] = [];

  const append = <Type extends BreakoutEngineEventType>(
    type: Type,
    participants: readonly string[],
    payload: BreakoutEventPayloadByType[Type],
    before: BreakoutSnapshot,
    after: BreakoutSnapshot,
  ) => {
    assertParticipants(participants);
    const sequence = startSequence + events.length;
    const event = Object.freeze({
      id: `breakout-event-${String(sequence + 1).padStart(4, '0')}`,
      sequence,
      act: 'act-2' as const,
      type,
      participants: Object.freeze([...participants]),
      payload: Object.freeze({ ...payload }),
      before,
      after,
    }) as BreakoutEngineEventFor<Type>;
    events.push(event as BreakoutEngineEvent);
  };

  const escapeRun = simulateEscapeRun(laneIds, deckSeed, photoSeed);
  if (escapeRun.beats.length === 0) {
    append(
      'act.skipped',
      laneIds,
      { reason: 'field-already-small', inputIds: laneIds, destination: 'act-3' },
      snapshot,
      snapshot,
    );
    return Object.freeze({
      entries: canonicalEntries,
      ...escapeRun,
      events: Object.freeze(events),
    });
  }

  append('act.started', laneIds, { actId: 'act-2', inputIds: laneIds }, snapshot, snapshot);

  escapeRun.beats.forEach((beat) => {
    const before = snapshot;
    const beforeState = before.currentActState;
    if (beforeState.kind !== 'race') throw new Error('Escape Run entered an invalid state.');
    const nextDistances = { ...beforeState.distanceById };
    beat.moves.forEach((move) => {
      nextDistances[move.playerId] = move.to;
    });
    beat.newlyQualified.forEach((qualification) => {
      statuses[qualification.playerId] = 'qualified';
    });
    beat.eliminatedIds.forEach((id) => {
      statuses[id] = 'eliminated';
    });
    const afterState = freezeRaceState({
      kind: 'race',
      laneIds,
      distanceById: Object.freeze(nextDistances),
      qualifications: beat.allQualified,
      beatIndex: beat.beatIndex,
      complete: beat.raceComplete,
    });
    const after = createSnapshot(canonicalIds, statuses, afterState);
    append(
      'race.beat-resolved',
      beat.moves.map((move) => move.playerId),
      { beat },
      before,
      after,
    );
    snapshot = after;
  });

  append(
    'act.completed',
    escapeRun.qualifierIds,
    { actId: 'act-2', outputIds: escapeRun.qualifierIds },
    snapshot,
    snapshot,
  );

  return Object.freeze({
    entries: canonicalEntries,
    ...escapeRun,
    events: Object.freeze(events),
  });
}
