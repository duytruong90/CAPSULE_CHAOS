import { BREAKOUT_RULES } from './config';
import { simulateFaultline } from './faultline';
import { simulateEscapeRun } from './escapeRun';
import { simulateFinalClash, type FinalClashSeeds } from './finalClash';
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
  FinalClashActResult,
  ClashViewState,
  ClashMatchupView,
  ClashExchange,
  BreakoutRandomSeeds,
  BreakoutSimulationResult,
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

function freezeClashState(state: ClashViewState): ClashViewState {
  return Object.freeze({
    ...state,
    seededSeatIds: Object.freeze([...state.seededSeatIds]),
    activeMatchIds: Object.freeze([...state.activeMatchIds]),
    playerIdsByMatch: Object.freeze({ ...state.playerIdsByMatch }),
    pointsToWinByMatch: Object.freeze({ ...state.pointsToWinByMatch }),
    scoreByMatch: Object.freeze({ ...state.scoreByMatch }),
    completedMatchIds: Object.freeze([...state.completedMatchIds]),
  });
}

function zeroClashScore(): readonly [number, number] {
  return Object.freeze([0, 0]);
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
 * Builds the complete standalone Act 1 engine record without selecting a
 * placeholder winner. The full production simulation extends this event stream.
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

/** Builds Act 3 with one terminal winner event and no duplicated decisive exchange. */
export function simulateFinalClashAct(
  entries: readonly BreakoutEntry[],
  inputIds: readonly string[],
  seeds: FinalClashSeeds,
  startSequence = 0,
): FinalClashActResult {
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
  const inputSet = new Set(inputIds);
  if (
    inputSet.size !== inputIds.length ||
    inputIds.some((id) => !canonicalIds.includes(id)) ||
    inputIds.length === 0 ||
    inputIds.length > 4
  ) {
    throw new Error('invalid-clash-field');
  }
  const clashIds = Object.freeze(canonicalIds.filter((id) => inputSet.has(id)));
  const bracket = simulateFinalClash(clashIds, seeds);
  const statuses: Record<string, BreakoutStatus> = Object.fromEntries(
    canonicalIds.map((id) => [id, inputSet.has(id) ? 'qualified' : 'eliminated']),
  );
  const emptyState = freezeClashState({
    kind: 'clash',
    route: bracket.route,
    seededSeatIds: Object.freeze([]),
    byePlayerId: null,
    activeMatchIds: Object.freeze([]),
    playerIdsByMatch: Object.freeze({}),
    pointsToWinByMatch: Object.freeze({}),
    scoreByMatch: Object.freeze({}),
    completedMatchIds: Object.freeze([]),
    complete: false,
  });
  let snapshot = createSnapshot(canonicalIds, statuses, emptyState);
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
      act: 'act-3' as const,
      type,
      participants: Object.freeze([...participants]),
      payload: Object.freeze({ ...payload }),
      before,
      after,
    }) as BreakoutEngineEventFor<Type>;
    events.push(event as BreakoutEngineEvent);
  };

  const actBefore = snapshot;
  clashIds.forEach((id) => {
    statuses[id] = 'active';
  });
  snapshot = createSnapshot(canonicalIds, statuses, emptyState);
  append('act.started', clashIds, { actId: 'act-3', inputIds: clashIds }, actBefore, snapshot);

  if (bracket.route === 'one') {
    const winnerId = bracket.winnerId;
    statuses[winnerId] = 'winner';
    const terminalState = freezeClashState({ ...emptyState, complete: true });
    const after = createSnapshot(canonicalIds, statuses, terminalState);
    append(
      'winner.declared',
      [winnerId],
      { winnerId, reason: 'sole-entry', decisiveExchange: null },
      snapshot,
      after,
    );
    return Object.freeze({ entries: canonicalEntries, bracket, events: Object.freeze(events) });
  }

  const openingMatches =
    bracket.semifinalMatches.length > 0
      ? bracket.semifinalMatches
      : bracket.finalMatch
        ? [bracket.finalMatch]
        : [];
  const matchups: readonly ClashMatchupView[] = Object.freeze(
    openingMatches.map((match) =>
      Object.freeze({
        matchId: match.matchId,
        playerIds: match.playerIds,
        pointsToWin: match.pointsToWin,
      }),
    ),
  );
  const openingState = freezeClashState({
    kind: 'clash',
    route: bracket.route,
    seededSeatIds: bracket.seededSeatIds,
    byePlayerId: bracket.byePlayerId,
    activeMatchIds: Object.freeze(matchups.map((match) => match.matchId)),
    playerIdsByMatch: Object.freeze(
      Object.fromEntries(matchups.map((match) => [match.matchId, match.playerIds])),
    ),
    pointsToWinByMatch: Object.freeze(
      Object.fromEntries(matchups.map((match) => [match.matchId, match.pointsToWin])),
    ),
    scoreByMatch: Object.freeze(
      Object.fromEntries(matchups.map((match) => [match.matchId, zeroClashScore()])),
    ),
    completedMatchIds: Object.freeze([]),
    complete: false,
  });
  const bracketBefore = snapshot;
  snapshot = createSnapshot(canonicalIds, statuses, openingState);
  append(
    'clash.bracket-ready',
    clashIds,
    {
      route: bracket.route,
      seededSeatIds: bracket.seededSeatIds,
      byePlayerId: bracket.byePlayerId,
      matchups,
    },
    bracketBefore,
    snapshot,
  );

  const appendExchangeBatch = (exchanges: readonly ClashExchange[]) => {
    const before = snapshot;
    const beforeState = before.currentActState;
    if (beforeState.kind !== 'clash') throw new Error('Final Clash entered an invalid state.');
    const nextScores = { ...beforeState.scoreByMatch };
    const completed = new Set(beforeState.completedMatchIds);
    exchanges.forEach((exchange) => {
      nextScores[exchange.matchId] = exchange.scoreAfter;
      if (exchange.matchWinnerId && exchange.matchLoserId) {
        completed.add(exchange.matchId);
        statuses[exchange.matchWinnerId] = 'qualified';
        statuses[exchange.matchLoserId] = 'eliminated';
      }
    });
    const afterState = freezeClashState({
      ...beforeState,
      scoreByMatch: Object.freeze(nextScores),
      activeMatchIds: Object.freeze(
        beforeState.activeMatchIds.filter((matchId) => !completed.has(matchId)),
      ),
      completedMatchIds: Object.freeze([...completed]),
    });
    const after = createSnapshot(canonicalIds, statuses, afterState);
    append(
      'clash.exchange-resolved',
      [...new Set(exchanges.flatMap((exchange) => exchange.playerIds))],
      { exchanges: Object.freeze([...exchanges]) },
      before,
      after,
    );
    snapshot = after;
  };

  if (bracket.semifinalMatches.length > 0) {
    const maxLength = Math.max(...bracket.semifinalMatches.map((match) => match.exchanges.length));
    for (let index = 0; index < maxLength; index += 1) {
      const batch = bracket.semifinalMatches.flatMap((match) => {
        const exchange = match.exchanges[index];
        return exchange ? [exchange] : [];
      });
      appendExchangeBatch(batch);
    }

    const finalMatch = bracket.finalMatch;
    if (!finalMatch) throw new Error('Final Clash route is missing its championship match.');
    const finalists = finalMatch.playerIds;
    finalists.forEach((id) => {
      statuses[id] = 'active';
    });
    const before = snapshot;
    const finalState = freezeClashState({
      kind: 'clash',
      route: bracket.route,
      seededSeatIds: bracket.seededSeatIds,
      byePlayerId: bracket.byePlayerId,
      activeMatchIds: Object.freeze(['final']),
      playerIdsByMatch: Object.freeze({ final: finalists }),
      pointsToWinByMatch: Object.freeze({ final: 3 }),
      scoreByMatch: Object.freeze({
        final: zeroClashScore(),
      }),
      completedMatchIds: Object.freeze([]),
      complete: false,
    });
    snapshot = createSnapshot(canonicalIds, statuses, finalState);
    append('clash.final-ready', finalists, { finalistIds: finalists }, before, snapshot);
  }

  const finalMatch = bracket.finalMatch;
  if (!finalMatch) throw new Error('Final Clash route is missing its championship match.');
  finalMatch.exchanges.slice(0, -1).forEach((exchange) => appendExchangeBatch([exchange]));
  const decisiveExchange = finalMatch.exchanges.at(-1);
  if (!decisiveExchange?.matchWinnerId || !decisiveExchange.matchLoserId) {
    throw new Error('Final Clash is missing its decisive exchange.');
  }
  const before = snapshot;
  const beforeState = before.currentActState;
  if (beforeState.kind !== 'clash') throw new Error('Final Clash ended in an invalid state.');
  canonicalIds.forEach((id) => {
    statuses[id] = id === decisiveExchange.matchWinnerId ? 'winner' : 'eliminated';
  });
  const afterState = freezeClashState({
    ...beforeState,
    scoreByMatch: Object.freeze({
      ...beforeState.scoreByMatch,
      final: decisiveExchange.scoreAfter,
    }),
    activeMatchIds: Object.freeze([]),
    completedMatchIds: Object.freeze(['final']),
    complete: true,
  });
  const after = createSnapshot(canonicalIds, statuses, afterState);
  append(
    'winner.declared',
    decisiveExchange.playerIds,
    {
      winnerId: decisiveExchange.matchWinnerId,
      reason: 'final-score',
      decisiveExchange,
    },
    before,
    after,
  );

  return Object.freeze({ entries: canonicalEntries, bracket, events: Object.freeze(events) });
}

/** Runs all three acts from one already-derived random-stream record. */
export function simulateBreakout(
  entries: readonly BreakoutEntry[],
  seeds: BreakoutRandomSeeds,
  publicCommitment: string,
): BreakoutSimulationResult {
  const faultline = simulateFaultlineAct(entries, seeds.floor, publicCommitment);
  const escapeRun = simulateEscapeRunAct(
    faultline.entries,
    faultline.survivorIds,
    seeds['race-decks'],
    seeds['race-photo'],
    faultline.events.length,
  );
  const finalClash = simulateFinalClashAct(
    escapeRun.entries,
    escapeRun.qualifierIds,
    seeds,
    faultline.events.length + escapeRun.events.length,
  );
  const events = Object.freeze([...faultline.events, ...escapeRun.events, ...finalClash.events]);
  if (events.length > 500) throw new Error('Breakout exceeded the 500-event hard cap.');
  events.forEach((event, index) => {
    if (
      event.sequence !== index ||
      event.id !== `breakout-event-${String(index + 1).padStart(4, '0')}`
    ) {
      throw new Error('Breakout event history is not contiguous.');
    }
  });
  const terminal = events.at(-1);
  if (terminal?.type !== 'winner.declared') {
    throw new Error('Breakout did not finish with an official winner.');
  }
  return Object.freeze({
    entries: faultline.entries,
    faultline: Object.freeze({ survivorIds: faultline.survivorIds, waves: faultline.waves }),
    escapeRun: Object.freeze({
      qualifierIds: escapeRun.qualifierIds,
      movementDecksById: escapeRun.movementDecksById,
      photoPriorityIds: escapeRun.photoPriorityIds,
      beats: escapeRun.beats,
    }),
    survivorIds: faultline.survivorIds,
    qualifierIds: escapeRun.qualifierIds,
    bracket: finalClash.bracket,
    winnerId: finalClash.bracket.winnerId,
    events,
  });
}
