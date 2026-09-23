import { buildFaultlineTimeline } from '../../game/breakout/buildBreakoutTimeline';
import { simulateFaultlineAct } from '../../game/breakout/simulateBreakout';
import { BreakoutPlaybackController } from '../../presentation/breakout/BreakoutPlaybackController';
import type { BreakoutEntry } from '../../game/breakout/types';

const seed = '22'.repeat(32);
const entries: BreakoutEntry[] = Array.from({ length: 21 }, (_, entryIndex) => ({
  id: `id-${entryIndex}`,
  displayName: `Player ${entryIndex}`,
  normalizedName: `Player ${entryIndex}`,
  entryIndex,
}));

function controller(autoAdvanceActs = true) {
  const result = simulateFaultlineAct(entries, seed, 'LOCK');
  return new BreakoutPlaybackController(buildFaultlineTimeline(result.events), {
    animationSpeed: 'normal',
    autoAdvanceActs,
  });
}

describe('BreakoutPlaybackController', () => {
  it('freezes immediately on pause and resumes from the same base offset', () => {
    const playback = controller();
    playback.tick(1_000);
    playback.tick(2_000);
    const beforePause = playback.state.elapsedBaseMs;
    playback.pause();
    playback.tick(20_000);
    expect(playback.state.elapsedBaseMs).toBe(beforePause);
    playback.resume();
    playback.tick(30_000);
    playback.tick(30_500);
    expect(playback.state.elapsedBaseMs).toBe(beforePause + 500);
  });

  it('settles an unresolved wave once and preserves its final result hold', () => {
    const playback = controller();
    playback.skip();
    playback.skip();
    expect(playback.currentEvent.type).toBe('faultline.wave-resolved');
    const resolution = playback.currentEvent.resolutionBaseMs as number;
    playback.skip();
    expect(playback.state.elapsedBaseMs).toBeGreaterThanOrEqual(resolution);
    expect(playback.currentSnapshot).toBe(playback.currentEvent.after);
    const eventIndex = playback.state.eventIndex;
    playback.skip();
    expect(playback.state.eventIndex).toBe(eventIndex + 1);
  });

  it('holds Act 1 completion for Next Act when automatic advance is off', () => {
    const playback = controller(false);
    while (playback.currentEvent.type !== 'act.completed') playback.skip();
    playback.tick(0);
    playback.tick(playback.currentEvent.durationBaseMs);
    expect(playback.state.atManualBoundary).toBe(true);
    expect(playback.state.paused).toBe(true);
    expect(playback.skip()).toEqual(playback.state);
  });
});
