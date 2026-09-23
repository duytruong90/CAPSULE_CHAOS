import { render, screen } from '@testing-library/react';
import {
  buildFaultlineTimeline,
  getFaultlineTiming,
} from '../../game/breakout/buildBreakoutTimeline';
import { simulateFaultlineAct } from '../../game/breakout/simulateBreakout';
import type { BreakoutEntry } from '../../game/breakout/types';
import { BreakoutStage } from '../../presentation/breakout/BreakoutStage';

const entries: BreakoutEntry[] = Array.from({ length: 33 }, (_, entryIndex) => ({
  id: `entry-${entryIndex}`,
  displayName: entryIndex === 0 ? '夜桜 🎮 Long Name That Wraps' : `Player ${entryIndex + 1}`,
  normalizedName: `Player ${entryIndex + 1}`,
  entryIndex,
}));

describe('Faultline stage', () => {
  const result = simulateFaultlineAct(entries, '34'.repeat(32), 'ABCD-EF01');
  const timeline = buildFaultlineTimeline(result.events);
  const waveEvent = timeline.events.find((event) => event.type === 'faultline.wave-resolved');

  it('renders the four clockwise sector labels and functional state text', () => {
    if (!waveEvent) throw new Error('Fixture has no wave.');
    render(<BreakoutStage entries={entries} event={waveEvent} elapsedBaseMs={0} />);
    expect(screen.getByText('FIND YOUR SECTOR.')).toBeInTheDocument();
    ['A', 'B', 'C', 'D'].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.getAllByText('STABLE')).toHaveLength(4);
    expect(screen.getByText(/Two sectors collapse each wave/u)).toBeInTheDocument();
  });

  it('reveals both hazard sectors together without changing status before resolution', () => {
    if (!waveEvent || waveEvent.engineEvent.type !== 'faultline.wave-resolved') {
      throw new Error('Fixture has no wave.');
    }
    const timing = getFaultlineTiming(waveEvent.engineEvent);
    const { rerender } = render(
      <BreakoutStage entries={entries} event={waveEvent} elapsedBaseMs={timing.warningStart} />,
    );
    expect(screen.getAllByText('DANGER')).toHaveLength(2);
    expect(waveEvent.before.eligibleIds).toEqual(waveEvent.engineEvent.payload.wave.inputIds);
    rerender(
      <BreakoutStage entries={entries} event={waveEvent} elapsedBaseMs={timing.resolution} />,
    );
    expect(screen.getByText(/OUT · \d+ REMAIN/u)).toBeInTheDocument();
    expect(waveEvent.after.eligibleIds).toEqual(waveEvent.engineEvent.payload.wave.survivorIds);
  });
});
