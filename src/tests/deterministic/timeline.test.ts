import { parseEntries } from '../../game/engine/entryValidation';
import { simulateGame } from '../../game/engine/simulateGame';
import { createGameConfig } from '../../game/state/gameConfig';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';
import {
  buildTimeline,
  extractTimelineOutcomes,
  serializeTimeline,
} from '../../game/timeline/buildTimeline';

const config = createGameConfig(DEFAULT_SETUP_CONFIG);
const seed = '1234567890abcdef'.repeat(4);

function createSimulation(size: number) {
  const roster = parseEntries(
    Array.from({ length: size }, (_, index) => `Timeline Player ${index + 1}`).join('\n'),
  );
  return simulateGame({ roster, config, seed });
}

describe('deterministic timeline generation', () => {
  it.each([30, 48, 60])('generates a complete immutable timeline for %s players', (size) => {
    const simulation = createSimulation(size);
    const timeline = buildTimeline(simulation);
    const knownIds = new Set(simulation.players.map((player) => player.id));

    expect(timeline.events.length).toBeGreaterThan(simulation.events.length);
    expect(Object.isFrozen(timeline)).toBe(true);
    expect(Object.isFrozen(timeline.events)).toBe(true);
    timeline.events.forEach((event, sequence) => {
      expect(event.sequence).toBe(sequence);
      expect(event.id).toBe(`timeline-${String(sequence + 1).padStart(4, '0')}`);
      expect(event.participants.every((id) => knownIds.has(id))).toBe(true);
      expect(Object.isFrozen(event)).toBe(true);
    });

    const winnerEvent = timeline.events.find((event) => event.type === 'winner');
    expect(winnerEvent?.payload.winnerId).toBe(simulation.winnerId);
    expect(timeline.winnerId).toBe(simulation.winnerId);
  });

  it('serializes identically for the same resolved simulation', () => {
    const first = buildTimeline(createSimulation(48));
    const second = buildTimeline(createSimulation(48));

    expect(serializeTimeline(second)).toBe(serializeTimeline(first));
  });

  it('does not make any result-affecting random calls', () => {
    const simulation = createSimulation(30);
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Timeline must not use randomness');
    });

    expect(() => buildTimeline(simulation)).not.toThrow();
    expect(Math.random).not.toHaveBeenCalled();
  });

  it('allows playback duration changes without altering outcome fields', () => {
    const simulation = createSimulation(48);
    const standard = buildTimeline(simulation);
    const instant = buildTimeline(simulation, {
      durationOverrides: {
        'capsule-spin': 0,
        'player-reveal': 0,
        elimination: 0,
        winner: 0,
      },
    });

    expect(extractTimelineOutcomes(instant)).toEqual(extractTimelineOutcomes(standard));
    expect(instant.events.map((event) => event.minimumDurationMs)).not.toEqual(
      standard.events.map((event) => event.minimumDurationMs),
    );
  });
});
