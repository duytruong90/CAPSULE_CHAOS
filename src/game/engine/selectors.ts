import type { Player } from '../state/gameTypes';
import type { SeededRng } from './rng';

const IN_PLAY_STATES = new Set<Player['state']>([
  'active',
  'safe',
  'revived',
  'finalist',
  'winner',
]);

export function isPlayerInPlay(player: Player) {
  return IN_PLAY_STATES.has(player.state);
}

export function selectInPlayPlayers(players: readonly Player[]) {
  return players.filter(isPlayerInPlay);
}

export function selectEliminatedPlayers(players: readonly Player[]) {
  return players.filter((player) => player.state === 'eliminated');
}

export function selectRandomInPlayPlayer(
  players: readonly Player[],
  rng: SeededRng,
  excludedPlayerIds: ReadonlySet<string> = new Set(),
) {
  const eligible = selectInPlayPlayers(players).filter(
    (player) => !excludedPlayerIds.has(player.id),
  );

  if (eligible.length === 0) {
    throw new RangeError('No eligible in-play player is available for selection.');
  }

  return rng.choose(eligible);
}

export function selectUniqueInPlayPlayers(
  players: readonly Player[],
  count: number,
  rng: SeededRng,
) {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('Selection count must be a non-negative safe integer.');
  }

  const eligible = selectInPlayPlayers(players);
  if (count > eligible.length) {
    throw new RangeError('Not enough eligible players for a unique selection.');
  }

  return rng.shuffle(eligible).slice(0, count);
}
