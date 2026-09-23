import { render, screen, within } from '@testing-library/react';
import {
  buildBreakoutTimeline,
  getRaceBeatTiming,
} from '../../game/breakout/buildBreakoutTimeline';
import { simulateEscapeRunAct } from '../../game/breakout/simulateBreakout';
import type { BreakoutEntry } from '../../game/breakout/types';
import { BreakoutStage } from '../../presentation/breakout/BreakoutStage';

const entries: BreakoutEntry[] = Array.from({ length: 12 }, (_, entryIndex) => ({
  id: `race-${entryIndex}`,
  displayName:
    entryIndex < 2 ? 'Duplicate' : entryIndex === 2 ? '夜桜 🎮' : `Racer ${entryIndex + 1}`,
  normalizedName: entryIndex < 2 ? 'Duplicate' : `Racer ${entryIndex + 1}`,
  entryIndex,
}));

describe('Escape Run presentation', () => {
  const result = simulateEscapeRunAct(
    entries,
    entries.map((entry) => entry.id),
    'ab'.repeat(32),
    'cd'.repeat(32),
  );
  const timeline = buildBreakoutTimeline(result.events);
  const beatEvents = timeline.events.filter((event) => event.type === 'race.beat-resolved');

  it('uses the exact closing-beat and ordinary-beat timing formulas', () => {
    beatEvents.forEach((event) => {
      if (event.engineEvent.type !== 'race.beat-resolved') return;
      const timing = getRaceBeatTiming(event.engineEvent);
      expect(timing.movementDuration).toBe(
        event.engineEvent.payload.beat.raceComplete ? 8_000 : 5_000,
      );
      expect(timing.resolution).toBe(
        2_800 +
          timing.movementDuration +
          (event.engineEvent.payload.beat.cutoffTieIds.length > 0 ? 4_000 : 0),
      );
      expect(timing.duration).toBe(timing.resolution + 5_000);
    });
  });

  it('keeps all lanes and gates visible without exposing movement early', () => {
    const event = beatEvents[0];
    if (!event || event.engineEvent.type !== 'race.beat-resolved') {
      throw new Error('Fixture has no race beat.');
    }
    const timing = getRaceBeatTiming(event.engineEvent);
    const { rerender } = render(
      <BreakoutStage entries={entries} event={event} elapsedBaseMs={timing.movementReveal - 1} />,
    );
    expect(screen.getAllByText('OPEN')).toHaveLength(4);
    expect(screen.queryByText(/^\+[123]$/u)).not.toBeInTheDocument();
    expect(screen.getByText('Duplicate · TICKET 1')).toBeInTheDocument();
    expect(screen.getByText('Duplicate · TICKET 2')).toBeInTheDocument();

    rerender(
      <BreakoutStage entries={entries} event={event} elapsedBaseMs={timing.movementReveal} />,
    );
    expect(screen.getAllByText(/^\+[123]$/u)).toHaveLength(
      event.engineEvent.payload.beat.moves.length,
    );
  });

  it('shows the official four only at the closing resolution', () => {
    const event = beatEvents.at(-1);
    if (!event || event.engineEvent.type !== 'race.beat-resolved') {
      throw new Error('Fixture has no closing beat.');
    }
    const timing = getRaceBeatTiming(event.engineEvent);
    const { rerender } = render(
      <BreakoutStage entries={entries} event={event} elapsedBaseMs={timing.movementStart} />,
    );
    const gates = within(screen.getByLabelText('Escape slots'));
    event.engineEvent.payload.beat.newlyQualified.forEach((qualification) => {
      expect(
        gates.queryByText(
          entries.find((entry) => entry.id === qualification.playerId)?.displayName ?? '',
        ),
      ).not.toBeInTheDocument();
    });
    rerender(<BreakoutStage entries={entries} event={event} elapsedBaseMs={timing.resolution} />);
    expect(screen.getByText('FOUR ESCAPED.')).toBeInTheDocument();
    expect(new Set(event.after.eligibleIds)).toEqual(new Set(result.qualifierIds));
  });
});
