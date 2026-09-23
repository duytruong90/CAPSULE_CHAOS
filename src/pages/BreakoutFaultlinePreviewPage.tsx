import { useMemo } from 'react';
import { GameStage } from '../components/GameStage/GameStage';
import { buildFaultlineTimeline, getFaultlineTiming } from '../game/breakout/buildBreakoutTimeline';
import { simulateFaultlineAct } from '../game/breakout/simulateBreakout';
import type { BreakoutEntry } from '../game/breakout/types';
import { BreakoutStage } from '../presentation/breakout/BreakoutStage';

const previewEntries: readonly BreakoutEntry[] = Object.freeze(
  Array.from({ length: 33 }, (_, entryIndex) =>
    Object.freeze({
      id: `preview-${String(entryIndex + 1).padStart(2, '0')}`,
      displayName:
        ['NightFox', '夜桜', 'DemonBlade', 'LightBringer', 'Haru 🎮', 'Captain Comet'][
          entryIndex % 6
        ] + ` · ${entryIndex + 1}`,
      normalizedName: `Preview ${entryIndex + 1}`,
      entryIndex,
    }),
  ),
);

export function BreakoutFaultlinePreviewPage() {
  const fixture = useMemo(() => {
    const result = simulateFaultlineAct(previewEntries, '34'.repeat(32), 'PREVIEW-LOCK-ONLY');
    const timeline = buildFaultlineTimeline(result.events);
    const waveEvent = timeline.events.find((event) => event.type === 'faultline.wave-resolved');
    if (!waveEvent || waveEvent.engineEvent.type !== 'faultline.wave-resolved') {
      throw new Error('Faultline preview could not create a wave.');
    }
    return {
      event: waveEvent,
      elapsedBaseMs: getFaultlineTiming(waveEvent.engineEvent).warningStart,
    };
  }, []);

  return (
    <GameStage label="Faultline development fixture">
      <BreakoutStage
        entries={previewEntries}
        event={fixture.event}
        elapsedBaseMs={fixture.elapsedBaseMs}
      />
    </GameStage>
  );
}
