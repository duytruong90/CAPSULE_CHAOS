import type { PhaseTargets } from '../state/gameTypes';

export function calculatePhaseTargets(startingPlayerCount: number): PhaseTargets {
  if (!Number.isSafeInteger(startingPlayerCount) || startingPlayerCount < 2) {
    throw new RangeError('A baseline simulation requires at least two players.');
  }

  const phase1Target =
    startingPlayerCount < 30
      ? Math.min(startingPlayerCount, Math.max(12, Math.ceil(startingPlayerCount * 0.4)))
      : Math.min(startingPlayerCount, 20);

  return {
    'phase-1': phase1Target,
    'phase-2': Math.min(phase1Target, 10),
    'phase-3': Math.min(phase1Target, 5),
    'phase-4': Math.min(phase1Target, 3),
    'phase-5': Math.min(phase1Target, 2),
    final: 1,
  };
}
