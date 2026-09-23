import { act, fireEvent, render, screen } from '@testing-library/react';
import { parseEntries } from '../../game/engine/entryValidation';
import { createLockedGameSession } from '../../game/state/gameSession';
import { DEFAULT_SETUP_CONFIG } from '../../game/state/setupTypes';
import { GameShow } from '../../presentation/GameShow';
import { PlaybackController } from '../../presentation/playbackController';
import { eventDuration } from '../../presentation/animationDurations';
import { EventRenderer } from '../../presentation/EventRenderer';
import { ChaosCard } from '../../components/ChaosCard/ChaosCard';
import { audioManager } from '../../audio/AudioManager';

const seed = '1234567890abcdef'.repeat(4);
const entries = parseEntries(Array.from({ length: 50 }, (_, i) => `Nguyễn 🎮 ${i}`).join('\n'));
const session = await createLockedGameSession(entries, DEFAULT_SETUP_CONFIG, { seed });
const draw = session.timeline.events.find((e) => e.type === 'player-reveal')!;

describe('timeline playback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it.each(['fast', 'normal', 'cinematic'] as const)(
    'autoplays 50 to 20 and holds the boundary at %s speed',
    (animationSpeed) => {
      const playback = new PlaybackController(
        session.timeline,
        { ...DEFAULT_SETUP_CONFIG, animationSpeed },
        50,
      );
      const disconnect = playback.connect();
      vi.runAllTimers();
      expect(playback.getSnapshot()).toMatchObject({
        stage: 'boundary',
        remaining: 20,
        settled: true,
      });
      expect(playback.event?.phase).toBe('phase-1');
      const index = playback.getSnapshot().index;
      vi.advanceTimersByTime(1_000_000);
      expect(playback.getSnapshot().index).toBe(index);
      playback.nextPhase();
      expect(playback.getSnapshot().stage).toBe('event');
      expect(playback.event?.phase).toBe('phase-2');
      disconnect();
    },
  );
  it('honors automatic phase advance through the complete precomputed show', () => {
    const playback = new PlaybackController(
      session.timeline,
      { ...DEFAULT_SETUP_CONFIG, autoAdvancePhases: true },
      50,
    );
    const disconnect = playback.connect();
    vi.runAllTimers();
    expect(playback.getSnapshot()).toMatchObject({ stage: 'complete', remaining: 1 });
    disconnect();
  });
  it('pauses after a card resolves, ignores repeated skip, and resumes the exact queue', () => {
    const playback = new PlaybackController(session.timeline, DEFAULT_SETUP_CONFIG, 50);
    const disconnect = playback.connect();
    while (playback.event?.type !== 'card-reveal') vi.advanceTimersToNextTimer();
    const index = playback.getSnapshot().index;
    playback.togglePause();
    vi.runAllTimers();
    expect(playback.getSnapshot()).toMatchObject({ index, paused: true, settled: true });
    playback.skip();
    playback.skip();
    expect(playback.getSnapshot().index).toBe(index);
    playback.togglePause();
    vi.runAllTimers();
    expect(playback.getSnapshot()).toMatchObject({ stage: 'boundary', remaining: 20 });
    disconnect();
  });
  it('skip settles each event exactly once and produces the same boundary count', () => {
    const playback = new PlaybackController(session.timeline, DEFAULT_SETUP_CONFIG, 50);
    const disconnect = playback.connect();
    while (playback.getSnapshot().stage !== 'boundary') {
      playback.skip();
      playback.skip();
      if (playback.getSnapshot().stage !== 'boundary') vi.advanceTimersToNextTimer();
    }
    expect(playback.getSnapshot().remaining).toBe(20);
    expect(session.timeline.winnerId).toBe(session.simulation.winnerId);
    disconnect();
  });
  it('detaching and reconnecting keeps position and elapsed time without duplicate timers', () => {
    const playback = new PlaybackController(session.timeline, DEFAULT_SETUP_CONFIG, 50);
    const disconnect = playback.connect();
    vi.advanceTimersByTime(1000);
    disconnect();
    vi.advanceTimersByTime(10000);
    expect(playback.getSnapshot()).toMatchObject({ index: -1, elapsedMs: 1000 });
    const reconnect = playback.connect();
    vi.runAllTimers();
    expect(playback.getSnapshot()).toMatchObject({ stage: 'boundary', remaining: 20 });
    reconnect();
  });
  it('recovers during a final fake-out and preserves the locked official winner', () => {
    const config = { ...DEFAULT_SETUP_CONFIG, autoAdvancePhases: true };
    const playback = new PlaybackController(session.timeline, config, 50);
    const disconnect = playback.connect();
    while (playback.event?.type !== 'fake-winner') vi.advanceTimersToNextTimer();
    vi.advanceTimersByTime(Math.floor(playback.duration / 2));
    disconnect();
    const snapshot = playback.getSnapshot();
    const recovered = new PlaybackController(session.timeline, config, 50, snapshot);
    const disconnectRecovered = recovered.connect();
    vi.runAllTimers();
    expect(recovered.getSnapshot()).toMatchObject({ stage: 'complete', remaining: 1 });
    expect(recovered.event?.type).toBe('winner');
    expect(session.timeline.winnerId).toBe(session.simulation.winnerId);
    disconnectRecovered();
  });
  it('renders the UI boundary, count and controls without exposing seed or winner', () => {
    const playback = new PlaybackController(session.timeline, DEFAULT_SETUP_CONFIG, 50);
    const view = render(<GameShow session={session} playback={playback} title="Test giveaway" />);
    expect(screen.getByRole('button', { name: 'Next Phase' })).toBeDisabled();
    expect(view.container.textContent).not.toContain(seed);
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByText('PHASE I COMPLETE')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '20 SURVIVORS' })).toBeInTheDocument();
    expect(screen.queryByText('OFFICIAL WINNER')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next Phase' }));
    expect(playback.event?.phase).toBe('phase-2');
    expect(screen.getByText('PHASE II')).toBeInTheDocument();
  });
});

describe('resolved visual components', () => {
  it('reveals only the known timeline participant and respects duration profiles', () => {
    render(<EventRenderer event={draw} entries={entries} settled durationMs={900} />);
    expect(
      screen.getByRole('heading', {
        name: entries.find((e) => e.id === draw.participants[0])!.displayName,
      }),
    ).toBeInTheDocument();
    expect(eventDuration(draw, 'fast')).toBeLessThan(eventDuration(draw, 'normal'));
    expect(eventDuration(draw, 'cinematic')).toBeGreaterThan(eventDuration(draw, 'normal'));
  });
  it.each(['common', 'rare', 'epic', 'legendary'] as const)(
    'renders a generic %s frame with dynamic text and forced end state',
    (rarity) => {
      const longName = 'An unusually long Chaos Card title';
      const description =
        'A readable explanation of an already resolved effect with a long description.';
      const props = {
        cardId: 'fixture',
        name: longName,
        rarity,
        description,
        presentationKey: 'unknown.future-card',
        targetText: '夜桜 · Nguyễn 🎮',
        resultText: 'SAFE',
        durationMs: 3000,
      };
      const view = render(<ChaosCard {...props} />);
      expect(screen.getByRole('heading', { name: longName })).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
      view.rerender(<ChaosCard {...props} settled />);
      expect(screen.getByRole('region', { name: /Chaos Card/ })).toHaveAttribute(
        'data-settled',
        'true',
      );
    },
  );
  it('audio hooks honor mute and isolate adapter failures', () => {
    const listener = vi.fn(() => {
      throw new Error('asset failed');
    });
    const unsubscribe = audioManager.subscribe(listener);
    audioManager.cue({ cue: 'card.epic.charge', eventId: 'test' }, false);
    expect(listener).not.toHaveBeenCalled();
    expect(() =>
      audioManager.cue({ cue: 'card.epic.charge', eventId: 'test' }, true),
    ).not.toThrow();
    unsubscribe();
  });
});
