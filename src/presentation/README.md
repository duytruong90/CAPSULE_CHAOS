# Presentation

`PlaybackController` consumes only the precomputed timeline and configuration. It
owns one completion clock and publishes immutable snapshots via `useSyncExternalStore`.
`complete()` is idempotent; skip resolves the current event (including its displayed
count) and holds its end state briefly. Pause lets the current animation complete.
Disconnect cancels the clock and retains its remaining duration for route re-entry.

`EventRenderer` and the reusable machine/capsule/name/card components only display
resolved payloads. `animationDurations` owns speed and rarity timings;
`presentationRegistry` maps visual keys independently of card effects. Unknown card
keys use their rarity's generic frame. `ChaosCard.settled` forces the visual end state.
CSS respects reduced-motion preferences without changing the queue or outcomes.

Only Phase 1 plays in this build. Its completion requires Next Phase unless automatic
phase advance is enabled; both lead to a handoff for the future Phase 2 renderer.
Audio cue delivery is centralized and optional. No asset or sound completion can
block playback. Neither the final simulation state nor the seed drives visuals.
