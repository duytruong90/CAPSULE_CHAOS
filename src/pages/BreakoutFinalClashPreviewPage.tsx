import { useMemo } from 'react';
import { GameStage } from '../components/GameStage/GameStage';
import {
  buildBreakoutTimeline,
  getClashExchangeTiming,
} from '../game/breakout/buildBreakoutTimeline';
import { simulateFinalClashAct } from '../game/breakout/simulateBreakout';
import type { BreakoutEntry } from '../game/breakout/types';
import { BreakoutStage } from '../presentation/breakout/BreakoutStage';

const previewEntries: readonly BreakoutEntry[] = Object.freeze(
  ['NightFox', '夜桜', 'DemonBlade', 'Captain Comet 🚀'].map((displayName, entryIndex) =>
    Object.freeze({
      id: `clash-preview-${entryIndex + 1}`,
      displayName,
      normalizedName: displayName.normalize('NFC'),
      entryIndex,
    }),
  ),
);

export function BreakoutFinalClashPreviewPage() {
  const fixture = useMemo(() => {
    const result = simulateFinalClashAct(
      previewEntries,
      previewEntries.map((entry) => entry.id),
      {
        bracket: '11'.repeat(32),
        'clash-sf1': '22'.repeat(32),
        'clash-sf2': '33'.repeat(32),
        'clash-playin': '44'.repeat(32),
        'clash-final': '55'.repeat(32),
      },
    );
    const timeline = buildBreakoutTimeline(result.events);
    const winnerEvent = timeline.events.find((event) => event.type === 'winner.declared');
    if (!winnerEvent || winnerEvent.engineEvent.type !== 'winner.declared') {
      throw new Error('Final Clash preview could not create a winner.');
    }
    const timing = getClashExchangeTiming(winnerEvent.engineEvent);
    return { event: winnerEvent, elapsedBaseMs: timing.resolution + 1_400 };
  }, []);

  return (
    <GameStage label="Final Clash development fixture">
      <BreakoutStage
        entries={previewEntries}
        event={fixture.event}
        elapsedBaseMs={fixture.elapsedBaseMs}
      />
    </GameStage>
  );
}
