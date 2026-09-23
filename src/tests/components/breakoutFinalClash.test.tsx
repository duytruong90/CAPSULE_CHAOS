import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildBreakoutTimeline,
  getClashExchangeTiming,
} from '../../game/breakout/buildBreakoutTimeline';
import { simulateFinalClashAct } from '../../game/breakout/simulateBreakout';
import type { BreakoutEntry } from '../../game/breakout/types';
import { BreakoutStage } from '../../presentation/breakout/BreakoutStage';

const entries: BreakoutEntry[] = ['Alpha', 'Bravo', 'Charlie', 'Delta'].map(
  (displayName, entryIndex) => ({
    id: displayName.toLowerCase(),
    displayName,
    normalizedName: displayName,
    entryIndex,
  }),
);

function fixture(count = 4, finalSeed = '5'.repeat(64)) {
  const roster = entries.slice(0, count);
  const result = simulateFinalClashAct(
    roster,
    roster.map((entry) => entry.id),
    {
      bracket: '1'.repeat(64),
      'clash-sf1': '2'.repeat(64),
      'clash-sf2': '3'.repeat(64),
      'clash-playin': '4'.repeat(64),
      'clash-final': finalSeed,
    },
  );
  return { roster, result, timeline: buildBreakoutTimeline(result.events) };
}

describe('Final Clash presentation', () => {
  it('uses the exact semifinal and score-triggered final timing formulas', () => {
    for (let sample = 0; sample < 80; sample += 1) {
      const { timeline } = fixture(4, sample.toString(16).padStart(64, '0'));
      timeline.events.forEach((event) => {
        if (
          event.engineEvent.type !== 'clash.exchange-resolved' &&
          event.engineEvent.type !== 'winner.declared'
        )
          return;
        const timing = getClashExchangeTiming(event.engineEvent);
        const exchange =
          event.engineEvent.type === 'winner.declared'
            ? event.engineEvent.payload.decisiveExchange
            : event.engineEvent.payload.exchanges[0];
        if (!exchange) return;
        if (exchange.matchId !== 'final') {
          expect(timing.resolution).toBe(7_600);
          expect(timing.duration).toBe(12_000);
        } else {
          const expectedExtra = exchange.scoreBefore.every((score) => score === 2)
            ? 4_000
            : exchange.scoreBefore.includes(2)
              ? 2_000
              : 0;
          expect(timing.extraHold).toBe(expectedExtra);
          expect(timing.resolution).toBe(9_000 + expectedExtra);
        }
      });
    }
  });

  it('keeps moves sealed and the old score accessible until reveal and resolution', () => {
    const { roster, timeline } = fixture();
    const exchangeEvent = timeline.events.find((event) => event.type === 'clash.exchange-resolved');
    if (!exchangeEvent || exchangeEvent.engineEvent.type !== 'clash.exchange-resolved') {
      throw new Error('missing exchange fixture');
    }
    const timing = getClashExchangeTiming(exchangeEvent.engineEvent);
    const { rerender } = render(
      <BreakoutStage entries={roster} event={exchangeEvent} elapsedBaseMs={0} />,
    );
    expect(screen.getAllByAltText('Sealed move')).toHaveLength(4);
    exchangeEvent.engineEvent.payload.exchanges.forEach((exchange) => {
      expect(
        screen.getAllByLabelText(`${exchange.scoreBefore[0]} of 2 points`).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByLabelText(`${exchange.scoreBefore[1]} of 2 points`).length,
      ).toBeGreaterThan(0);
    });

    rerender(<BreakoutStage entries={roster} event={exchangeEvent} elapsedBaseMs={timing.flip} />);
    expect(screen.queryByAltText('Sealed move')).not.toBeInTheDocument();

    rerender(
      <BreakoutStage entries={roster} event={exchangeEvent} elapsedBaseMs={timing.resolution} />,
    );
    exchangeEvent.engineEvent.payload.exchanges.forEach((exchange) => {
      expect(
        screen.getAllByLabelText(`${exchange.scoreAfter[0]} of 2 points`).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByLabelText(`${exchange.scoreAfter[1]} of 2 points`).length,
      ).toBeGreaterThan(0);
    });
  });

  it('announces the seeded bye throughout the three-player play-in', () => {
    const { roster, timeline, result } = fixture(3);
    const bracket = timeline.events.find((event) => event.type === 'clash.bracket-ready');
    if (!bracket) throw new Error('missing bracket fixture');
    render(<BreakoutStage entries={roster} event={bracket} elapsedBaseMs={5_000} />);
    expect(screen.getByText('SEEDED BYE — AWAITS FINAL')).toBeInTheDocument();
    expect(
      screen.getByText(
        roster.find((entry) => entry.id === result.bracket.byePlayerId)!.displayName,
      ),
    ).toBeInTheDocument();
  });

  it('renders one official winner at the decisive resolution', () => {
    const { roster, timeline } = fixture();
    const winner = timeline.events.find((event) => event.type === 'winner.declared');
    if (!winner || winner.engineEvent.type !== 'winner.declared') {
      throw new Error('missing winner');
    }
    const winnerEngineEvent = winner.engineEvent;
    const timing = getClashExchangeTiming(winnerEngineEvent);
    render(<BreakoutStage entries={roster} event={winner} elapsedBaseMs={timing.resolution} />);
    expect(screen.getByText('OFFICIAL WINNER')).toBeInTheDocument();
    const winnerName = roster.find(
      (entry) => entry.id === winnerEngineEvent.payload.winnerId,
    )!.displayName;
    expect(screen.getAllByText(new RegExp(winnerName, 'i')).length).toBeGreaterThan(0);
  });
});
