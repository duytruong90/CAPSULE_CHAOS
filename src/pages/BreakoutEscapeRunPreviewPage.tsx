import { useMemo } from 'react';
import { GameStage } from '../components/GameStage/GameStage';
import { buildBreakoutTimeline, getRaceBeatTiming } from '../game/breakout/buildBreakoutTimeline';
import { simulateEscapeRunAct } from '../game/breakout/simulateBreakout';
import type { BreakoutEntry } from '../game/breakout/types';
import { BreakoutStage } from '../presentation/breakout/BreakoutStage';

const previewEntries: readonly BreakoutEntry[] = Object.freeze(
  Array.from({ length: 12 }, (_, entryIndex) =>
    Object.freeze({
      id: `race-preview-${String(entryIndex + 1).padStart(2, '0')}`,
      displayName:
        ['NightFox', '夜桜', 'DemonBlade', 'LightBringer', 'Haru 🎮', 'Captain Comet'][
          entryIndex % 6
        ] + ` · ${entryIndex + 1}`,
      normalizedName: `Race Preview ${entryIndex + 1}`,
      entryIndex,
    }),
  ),
);

export function BreakoutEscapeRunPreviewPage() {
  const fixture = useMemo(() => {
    const result = simulateEscapeRunAct(
      previewEntries,
      previewEntries.map((entry) => entry.id),
      'ab'.repeat(32),
      'cd'.repeat(32),
    );
    const timeline = buildBreakoutTimeline(result.events);
    const beatEvent = timeline.events.filter((event) => event.type === 'race.beat-resolved').at(-1);
    if (!beatEvent || beatEvent.engineEvent.type !== 'race.beat-resolved') {
      throw new Error('Escape Run preview could not create a closing beat.');
    }
    const timing = getRaceBeatTiming(beatEvent.engineEvent);
    return {
      event: beatEvent,
      elapsedBaseMs: timing.movementStart + timing.movementDuration * 0.62,
    };
  }, []);

  return (
    <GameStage label="Escape Run development fixture">
      <BreakoutStage
        entries={previewEntries}
        event={fixture.event}
        elapsedBaseMs={fixture.elapsedBaseMs}
      />
    </GameStage>
  );
}
