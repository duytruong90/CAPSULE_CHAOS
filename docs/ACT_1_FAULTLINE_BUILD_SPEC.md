# Act 1 — Faultline: implementation specification

**Specification:** Breakout 1.0. **Status:** ready for implementation; not implemented by this document.
**Build order:** this file, [Act 2](ACT_2_ESCAPE_RUN_BUILD_SPEC.md), then [Act 3](ACT_3_FINAL_CLASH_BUILD_SPEC.md).

Read all three files before coding. Implement the decisions exactly. These files supersede `GAMEPLAY_REINVENTION.md`, the original planner, and the earlier interactive concept wherever they differ. The earlier concept is not a rules oracle. Do not add another design phase, pick among alternatives, or insert extra powers. File 1 owns the shared foundation; files 2 and 3 extend it.

## 1. Purpose and emotional arc

Faultline turns a long queue of individual eliminations into a shared disaster. Everyone sees their capsule before anything happens, discovers a temporary group, watches the floor become unsafe, and experiences a large result with the other viewers. The emotional progression is **recognition → shared vulnerability → warning → collapse → relief**. The viewer's question is: **“Is our sector going down?”** The machine dispenses the entire field once; it never returns to drawing individual contestants.

This act must quickly reduce a variable roster to a readable race field. It does not need a fixed final count. Membership in a safe sector is the complete survival rule. Capsules have no health, personal shields, immunity, extra lives, or resurrection. The second wave includes one clearly announced conveyor shift, specified below, so the spatial situation can change before resolution.

### Required audiovisual paragraph

Stage the act inside a vast, dark industrial capsule reactor viewed from a shallow overhead angle. Four steel platforms surround a deep central shaft; cool cyan perimeter lights initially suggest order, while amber warning strips and thin red fractures introduce danger. Capsules should have tangible glossy shells, restrained reflections, and large attached name labels. The background picture depicts machinery and distant depth, leaving the central floor visually quiet. Use sector-letter signs, fracture icons, and a conveyor-arrow icon as functional information, never decoration over names. Animation begins with a short collective spill and settling motion, becomes deliberate as warning pulses cross the floor, then delivers a synchronized platform drop with heavy dust descending into the shaft. Sound progresses from a low mechanical hum and scattered shell ticks to three spaced pressure knocks, restrained tension, a brief near-silence, and one deep collapse impact. The audience should feel caught inside a failing machine, then feel an audible release when the survivors' rails light up. Anxiety comes from the known approaching event and readable location, not blinding flashes, loudness spikes, or a long list of deaths.

## 2. Non-negotiable rules for variable entry counts

Let `N` be the number of valid locked **entries**, not distinct display names.

| Starting count | Route                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| 0              | Setup error; do not create a lock or simulation.                                                 |
| 1              | Skip Acts 1 and 2; Act 3 declares the sole entrant without pretending a contest occurred.        |
| 2–4            | Skip Acts 1 and 2; use the small-field bracket in Act 3.                                         |
| 5–16           | Skip Faultline; race all entries in Act 2 for four places.                                       |
| 17 or more     | Run Faultline waves while the actual survivor count is greater than 16; then race all survivors. |

There is no divisibility requirement and no new hard maximum roster count. Every positive count uses the same rules. Verify normal operation through 1,000 entries; larger rosters use the same algorithm and paginated presentation, subject to available browser memory. Do not claim unlimited-device performance. The host's preference for more than 20 entries is guidance, not a validation requirement.

For every wave:

1. Shuffle all currently active IDs uniformly with the Faultline RNG.
2. Draw `allocationOffset = rng.nextInt(0, 4)`.
3. In shuffled order, assign entry `i` to sector `(i + allocationOffset) % 4`.
4. Sector IDs are `0,1,2,3`, positioned clockwise: A top-left, B top-right, C bottom-right, D bottom-left.
5. Draw the two collapsing sector IDs using `rng.shuffle([0,1,2,3]).slice(0,2)`. Preserve this order in the audit; display labels in sector order.
6. If and only if `waveIndex === 2`, draw `rotationSteps = rng.choose([1,3])`. Otherwise use `0` and consume no rotation RNG call.
7. On wave 2, move every occupant from sector `s` to `(s + rotationSteps) % 4`. The platforms and their danger markings remain stationary. This is movement of contestants, not movement of the hazard.
8. Everyone occupying either collapsing sector **after** that movement is eliminated atomically. The other two sectors survive atomically.
9. Sort surviving IDs by original `entryIndex` for the next wave's input. Start a fresh shuffle next wave; permanent teams do not exist.
10. Repeat only if the actual survivor count still exceeds 16.

For input `n = 4q + r`, each sector has `q` or `q + 1` entries. Two surviving sectors therefore contain `2q`, `2q + 1`, or `2q + 2` entries, subject to the actual remainder. Do not remove extra entrants to reach a preferred number. Do not add empty placeholder contestants, duplicate real entries, or grant unnamed byes in this act.

For `n > 16`, every wave reduces the field and leaves at least eight entries. Thus any run starting above 16 reaches **8–16 survivors**. The wave count is determined by results, not by the starting number alone.

### Count examples — all branches are intentional

| Start | Permitted progression examples           |
| ----- | ---------------------------------------- |
| 17    | 17 → 8 or 9                              |
| 20    | 20 → 10                                  |
| 21    | 21 → 10 or 11                            |
| 23    | 23 → 11 or 12                            |
| 31    | 31 → 15 or 16                            |
| 33    | 33 → 16, or 33 → 17 → 8 or 9             |
| 40    | 40 → 20 → 10                             |
| 41    | 41 → 20 or 21 → 10 or 11                 |
| 48    | 48 → 24 → 12                             |
| 60    | 60 → 30 → 14, 15, or 16                  |
| 61    | 61 → 30 or 31 → 14, 15, or 16            |
| 100   | 100 → 50 → 24, 25, or 26 → 12, 13, or 14 |

These are possible counts, not scripted outcomes. Wave 2's rotation preserves sector sizes and does not change the allowed count bounds.

## 3. Signature event: Conveyor Shift

Include this mechanic exactly once, on wave 2 when that wave exists. Do not manufacture a second wave to show it. Before the first wave, the rules sentence includes: **“Two sectors collapse each wave. If we reach wave two, the conveyor moves everyone before the drop.”**

On wave 2, reveal the two dangerous platforms first. Then illuminate the conveyor ring, show **“CONVEYOR SHIFT — FOLLOW YOUR CAPSULE”**, and rotate the occupants by the locked one-quarter turn. `rotationSteps = 1` animates one clockwise quarter-turn; `3` animates one counterclockwise quarter-turn, not three clockwise turns. Display the movement direction with both an arrow and the word “CLOCKWISE” or “COUNTERCLOCKWISE.” Name labels move with their capsules. Dangerous floor outlines remain fixed. A three-second movement gives viewers time to see an actual escape or a newly dangerous destination.

Never choose the direction after seeing which named contestants would survive. Never call the early occupants “eliminated.” The only elimination occurs after the conveyor completes and the floor drops. This mechanic is already part of the locked outcome, not an override or revival.

## 4. Shared implementation foundation — owned by this file

### 4.1 Repository changes

Use the existing React, TypeScript, Vite, seeded RNG, commitment, audit, and playback architecture. Do not add a backend, live voting, physics engine, or external game framework.

Create these files:

| Path                                                             | Responsibility                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/game/breakout/types.ts`                                     | Shared V4 types, snapshots, event unions, result contracts.  |
| `src/game/breakout/config.ts`                                    | All fixed rule constants below.                              |
| `src/game/breakout/randomStreams.ts`                             | Async seed derivation; no presentation randomness.           |
| `src/game/breakout/simulateBreakout.ts`                          | Pure orchestration of all three acts.                        |
| `src/game/breakout/faultline.ts`                                 | Pure Act 1 simulation.                                       |
| `src/game/breakout/buildBreakoutTimeline.ts`                     | Engine events to timed presentation events.                  |
| `src/presentation/breakout/FaultlineStage.tsx` and `.module.css` | Floor and sector presentation.                               |
| `src/presentation/breakout/BreakoutStage.tsx` and `.module.css`  | Shared HUD and act renderer selection.                       |
| `src/presentation/breakout/BreakoutPlaybackController.ts`        | Single clock and persistent reveal position.                 |
| `src/presentation/breakout/cueSheet.ts`                          | Named audio cues and base-time offsets.                      |
| `scripts/build-breakout-media.mjs`                               | Offline SVG and WAV generation for the mandatory media pack. |

Update the existing session factory, setup validation/UI, app state provider, persistence, audit generation/verification, asset manifest/preloader, audio manager/adapter, and game page to select the Breakout implementation. Existing presentation components may be reused where their behavior matches this specification. Do not implement a new act by changing the labels on `runStandardPhase` or by emitting serial `player-drawn` events.

### 4.2 Exact rule configuration

These values are fixed and committed; they are not host-adjustable controls:

```ts
const BREAKOUT_RULES = {
  floorMaxSurvivors: 16,
  floorSectorCount: 4,
  floorCollapsingSectors: 2,
  conveyorWave: 2,
  raceSlots: 4,
  raceFinishDistance: 9,
  raceMovementDeck: [1, 1, 2, 2, 3, 3],
  semifinalPointsToWin: 2,
  finalPointsToWin: 3,
  maxEngineEvents: 500,
} as const;
```

Retain host controls for animation speed, sound, automatic act advance, roster display, duplicate-entry allowance, and reduced motion. Remove the fake-out intensity control from new games. Duplicate-name entries remain separate tickets only when the host has explicitly allowed duplicates; fairness is per ticket. Use unique entry IDs everywhere, never names as keys.

Change the setup minimum from eight to one. At 1 display “One entry: this run will declare that entry as the winner.” At 2–4 display “Small field: proceeding directly to Final Clash.” At 5–16 display “Compact run: Escape Run and Final Clash.” At 17–20 display “All three acts; a larger field creates more shared suspense.” At 21+ there is no small-pool warning. At 101+ add “Large field: names will page during Faultline.” These messages do not block Start. Empty roster and disallowed duplicates still block it.

### 4.3 Versioning and existing sessions

Use these exact new identifiers:

| Item              | Identifier                           |
| ----------------- | ------------------------------------ |
| Engine rules      | `capsule-chaos-engine-v4-breakout`   |
| Lock schema       | `capsule-chaos-lock-v4`              |
| Timeline schema   | `capsule-chaos-timeline-v3-breakout` |
| Persisted session | `capsule-chaos-session-v2-breakout`  |
| Audit schema      | `capsule-chaos-audit-v2-breakout`    |

Keep `xoshiro256**-v1` unchanged. Include the new rules identifier and fixed configuration in the canonical commitment payload before simulation.

Do not reinterpret old saved timelines or seeds as Breakout. Detect the existing `capsule-chaos.active-session.v1` localStorage key without modifying it. Show “A previous-rules session is saved. This version cannot resume it.” Provide **Download previous session JSON** and **Start a new Breakout**. The second action leaves the old key intact and opens setup. Do not silently clear or migrate its outcome. Unknown audit versions return `unsupported-rules-version`, never “verified.”

Store new immutable sessions in IndexedDB database `capsule-chaos-breakout`, version 1, object store `sessions`, key `active`. Store small playback checkpoints separately in store `checkpoints`, key `active`. Create both stores in `onupgradeneeded`. This avoids rewriting the full simulation every animation frame and avoids the old localStorage size ceiling for larger fields. Keep the session's commitment hash in its checkpoint; reject a mismatched pair. Commit the immutable session before navigating to `/game`.

Save checkpoints at every event boundary, pause, resume, skip, and act advance, plus every 250 ms while playing. Serialize writes through one queue so older checkpoints cannot overwrite newer ones. On refresh, restore the latest committed checkpoint paused. Losing up to 250 ms of presentation is acceptable; changing any result is not. If storage is blocked/full, continue in memory with a visible “Refresh recovery unavailable — download this session” status and a JSON download action. Do not silently promise recovery. No network storage is needed.

### 4.4 Random stream derivation and exact consumption boundaries

In `createLockedGameSession`, after creating the lock and before calling the pure simulator, derive one 256-bit seed per namespace below:

```text
floor
race-decks
race-photo
bracket
clash-sf1
clash-sf2
clash-playin
clash-final
```

For namespace `label`, hash the UTF-8 bytes of the exact string:

```text
capsule-chaos-engine-v4-breakout\0<normalized 64-character master seed>\0<label>
```

Here `\0` means one actual U+0000 byte, not the two printable characters. Use browser `crypto.subtle.digest('SHA-256', bytes)` and lower-case hexadecimal output. The eight derivations may run concurrently because each is independent. Pass a plain immutable record of these seed strings to the simulator. It constructs a fresh `SeededRng` for each namespace. Audit replay derives the same seeds again. No async cryptography inside act simulation functions.

Canonical entry iteration is ascending `entryIndex`; reject duplicate IDs or duplicate/non-integer entry indexes. Renaming entries must not alter ID-based outcomes. Shuffling changes display assignment; CSS motion, sound, speed, viewport, and pausing never consume these streams. Do not use `Math.random`, random-array sorting, wall-clock time, or a winner-first reroll.

### 4.5 Shared contracts

Define `ActId = 'act-1' | 'act-2' | 'act-3'` and `BreakoutStatus = 'active' | 'qualified' | 'eliminated' | 'winner'`.

Every engine event contains `id`, contiguous zero-based `sequence`, `act`, discriminated `type`, unique `participants`, typed `payload`, and immutable `before` and `after` view snapshots. IDs are `breakout-event-0001`, etc. A snapshot contains `statusById`, `eligibleIds`, and the typed current-act state. `eligibleIds` means everyone still able to win, including racers already qualified and semifinal winners waiting for the other match. A per-act status line shows race slots or match scores instead of mislabeling them as eliminations.

Use a discriminated event union, not an untyped payload dictionary. The common event types are:

- `show.locked`: roster count and public commitment; unchanged state.
- `act.started`: act identifier and input IDs; unchanged eligibility.
- `act.skipped`: `reason: 'field-already-small'`, input IDs and next non-skipped destination; unchanged eligibility.
- `act.completed`: output IDs; state as resolved by its last gameplay event.
- The act-specific result events defined in the relevant file.
- `winner.declared`: winner ID and `reason: 'final-score' | 'sole-entry'`.

The entire engine runs before playback. Its private precomputed result may know the winner. The stage, DOM labels, live regions, title text, audio choices and focus logic must reveal only what the current timeline offset permits. Keep seed and full audit behind the completed-show interface; this is spoiler prevention, not a claim that local storage hides data from the computer owner.

The V4 audit summary contains `startingEntryCount`, `floorWaves`, `raceBeats`, `raceQualifiers`, `clashMatches`, `eliminationGroups`, and `officialWinnerId`. Each elimination group records its source event ID and all eliminated IDs. Do not populate the new audit by filtering for the old singular `elimination` event type; doing so would omit group results. Include full locked configuration, master seed, stream namespace list, hidden preparation records and all engine/timeline events in the downloadable audit. The live audit panel uses the new act names and omits obsolete revival/card statistics.

`simulateBreakout` runs Act 1, passes its output IDs into Act 2, then passes that output into Act 3. Acts 1 and 2 never select the final winner. It returns a completed result with one winner, all other statuses eliminated, the locked roster, engine events, and version identifiers. The sole-entry route still produces exactly one `winner.declared` event.

### 4.6 Playback, snapshots, and sound contract

Every timeline event has `durationBaseMs`, `resolutionBaseMs` or `null`, semantic segment offsets, a cue sheet, and references to its engine event's `before`/`after` snapshots. Render the before state until the resolution offset, then the after state. Intermediate sector movement, distance interpolation, and move reveals are visual substate explicitly described by their event; never apply irreversible status changes early.

One presentation clock owns `eventIndex` and `elapsedBaseMs`. Convert wall time using existing speed multipliers Fast `0.6`, Normal `1`, Cinematic `1.5`: `elapsedBase += wallDelta / multiplier`. Use a monotonic clock. CSS/Web Animations consume this clock; they do not decide completion. Pause freezes movement, timers, score reveals, and sound immediately. Resume continues from the same offset. Skip stops pending sounds, settles the current event once, and preserves the 800 ms base result hold before advancing. If already settled, Skip advances once; it cannot reapply effects.

At a non-skipped Act 1/2 completion, hold for manual **Next Act** when auto-advance is off. Auto-advance uses the completion event's normal duration. Skipped acts have audit events but no empty title screen or manual pause. `show.locked` plays once for 8,000 ms; disable the old additional opening ceremony so it is not doubled. The last `winner.declared` event settles into the persistent winner screen and never auto-resets.

Disable Skip at a manual act boundary and on the persistent winner screen. Next Act is the only action that leaves a manual boundary. An immediate Pause freezes the current event even if its resolution has already occurred; Resume continues only its remaining hold. Do not accidentally apply a second state transition on resume.

Audio cues have unique `(eventId, cueId)` keys. Save the reveal offset, suppress past transient cues on recovery, and restore only the appropriate ambient bed after the user resumes. Pause/mute/skip stop active audio and cancel future cues. Keep at most one music bed, one ambient bed, and two transient voices; if full, drop the older transient, never an outcome cue. Gain defaults: music `0.18`, ambience `0.12`, transient `0.45`, final fanfare `0.55`; master `1`. During transient cues, duck beds to half their configured gains for the cue's duration, then restore over 250 ms. Failures and autoplay rejection are silent to the engine and never block progression. Mute preserves every visual meaning.

## 5. Act 1 data and result event

Implement `simulateFaultline(inputIds, floorSeed)` returning `{ survivorIds, waves }`; the orchestrator assigns global event IDs and snapshots. Input IDs refer to a validated locked roster. Do not mutate the caller's arrays.

```ts
interface FaultlineWave {
  waveIndex: number; // one-based
  inputIds: readonly string[];
  allocationOffset: 0 | 1 | 2 | 3;
  sectorsBefore: readonly [
    readonly string[],
    readonly string[],
    readonly string[],
    readonly string[],
  ];
  collapsingSectorIds: readonly [number, number];
  rotationSteps: 0 | 1 | 3;
  sectorsAfterShift: readonly [
    readonly string[],
    readonly string[],
    readonly string[],
    readonly string[],
  ];
  eliminatedIds: readonly string[]; // original entry order
  survivorIds: readonly string[]; // original entry order
}
```

Emit one `faultline.wave-resolved` per wave. Participants are all its input IDs. Before-state eligibility is the whole input; after-state marks exactly `eliminatedIds` eliminated and leaves survivors active. Both arrays form a disjoint, complete partition. Record all allocations, hazard IDs, and rotation in the event. Do not create one timeline event per eliminated person.

For `N <= 16`, return the unchanged input IDs and no waves; the orchestrator emits `act.skipped`. For a played act, emit start → one or more wave results → complete. At completion, publish the actual count, e.g. **“11 SURVIVORS — FOUR EXITS AHEAD.”**

## 6. Exact staging and timing

Use a 1920×1080 logical stage through the existing letterboxing component. Common safe margins are 64 px. Reserve y=0–132 for title, act/objective and counters; y=132–916 for the act; y=916–1080 for captions and host controls. Decorative art stays behind this content. At a 1280×720 share, labels must remain readable: floor names at least 28 logical px, count labels 30, major result 56. Permit two lines per name; retain the full Unicode name in accessible text and the roster drawer. Ellipsis is allowed after two lines but not as a mutation of the entry.

Place sectors as a 2×2 grid. Sector A/B are on the top row; D/C on the bottom row. A visible clockwise connector ring resolves the potentially confusing letter order. Each sector header shows its letter, occupant count, and `STABLE`, `DANGER`, or `DROPPED` as text plus shape. Red is not the only danger signal.

For up to 12 occupants per sector, show all names. Otherwise display synchronized pages of 12 per sector, each for 3,000 ms during assignment, with `PAGE x/y` and the full sector count. `assignmentMs = max(4000, 3000 * maxSectorPageCount)`. Smaller sectors hold their last page. Every name must appear before danger revelation. During warning and collapse hold the last shown page; represent all additional occupants with a labeled count. Provide a host roster drawer for lookup; opening it pauses playback and closing it leaves the show paused until Resume. No paging changes outcomes. Render no more than 48 name tiles and 32 decorative particles at once.

For the following table let `A = assignmentMs - 4000` and `S = rotationSteps === 0 ? 0 : 3000`:

| Base interval in ms     | Required visual and copy                                                                                         | Audio                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 0–`4000+A`              | Assign/page occupants; stable floor; “FIND YOUR SECTOR.”                                                         | Shell ticks for the first 700 ms; low reactor bed.                         |
| `4000+A`–`7000+A`       | A neutral diagnostic pulse visits A, B, C, D; label “SCANNING,” no safe/out claims.                              | Three pressure knocks at interval start, +1000, +2000.                     |
| `7000+A`–`10500+A`      | Reveal both actual hazard sectors together; persistent crack pattern; “TWO SECTORS WILL FALL.”                   | Alarm sting at start; low rising pressure.                                 |
| `10500+A`–`10500+A+S`   | Only when S=3000: conveyor movement and explicit direction; floor stays fixed.                                   | Conveyor motor and one relay clack.                                        |
| `10500+A+S`–`13000+A+S` | Occupants locked; “BRACE.” No blinking name tiles. Last 500 ms reduces beds to 10% of their configured gains.    | Two muted mechanical lock clicks at start and +900; no cue in last 500 ms. |
| `13000+A+S`–`14600+A+S` | Both dangerous platforms descend 90 logical px; dust falls down; safe platforms remain stable.                   | One combined collapse cue, not one per player.                             |
| `14600+A+S`–`20600+A+S` | Atomic state/counter commit at start; “X OUT · Y REMAIN.” Keep casualties visibly associated with their sectors. | Short survivor relay tone at start; tension bed releases.                  |
| `20600+A+S`–`22600+A+S` | Survivors hold; rails illuminate the route forward.                                                              | Quiet machinery only.                                                      |

`durationBaseMs = 22600 + A + S`; `resolutionBaseMs = 14600 + A + S`. Conveyor and all other animations must end at these times even if an asset is missing. On a later wave, the next assignment starts from the actual survivors without reintroducing eliminated names.

Act start lasts 8,000 ms: 0–2500 title/room reveal, 2500–5000 rule sentence, 5000–8000 collective capsule spill. Act completion lasts 6,000 ms with the survivor roster and next objective. Do not append the old per-elimination reaction durations.

## 7. Required asset pack and production directions

Generate all mandatory assets locally with `scripts/build-breakout-media.mjs`; add `pnpm assets:breakout` to run it. SVG backgrounds and overlays are the production baseline, so implementation never depends on an image-generation subscription or remote download. Use a `1920 1080` viewBox for backgrounds, `256 256` for icons, and `512 512` for effects. WAV files are PCM, 48 kHz, 16-bit, stereo, normalized to peak no higher than −3 dBFS, with 10 ms anti-click fades. Use deterministic synthesis; no borrowed music.

New manifest entries need explicit `src` paths because these backgrounds are SVG, unlike the existing WebP background helper. Keep assets under `public/assets/breakout/`. Existing capsule shell SVGs may be reused. Text, names, counters and danger labels are always rendered in the UI, never baked into pictures.

| Asset ID / file                                       | Mandatory content and exact use                                                                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg_faultline` / `bg_faultline.svg`                   | Four floor recesses around a center shaft, side machinery, subtle depth; center quiet; navy `#07111E`, steel `#263746`, cyan `#50D8E8`. No people, words, logos, or prepainted hazardous sectors. |
| `fx_floor_cracks` / `fx_floor_cracks.svg`             | Transparent branching fracture mask clipped to a sector; amber `#F0B34F` edge and red `#ED6A6A` core; state-driven visibility.                                                                    |
| `fx_floor_dust` / `fx_floor_dust.svg`                 | Transparent descending dust wisps, low opacity; never cover text.                                                                                                                                 |
| `icon_sector` / `icon_sector.svg`                     | A simple platform silhouette; UI overlays A–D separately.                                                                                                                                         |
| `icon_conveyor` / `icon_conveyor.svg`                 | One quarter-turn conveyor arrow; rotate/mirror by the actual direction.                                                                                                                           |
| `sfx_faultline_knock` / `sfx_faultline_knock.wav`     | 0.35 s muted metal pressure knock.                                                                                                                                                                |
| `sfx_faultline_warning` / `sfx_faultline_warning.wav` | 1.2 s two-note warning, firm but not piercing.                                                                                                                                                    |
| `sfx_conveyor_shift` / `sfx_conveyor_shift.wav`       | 3 s motor glide with a clack at 2.8 s.                                                                                                                                                            |
| `sfx_floor_collapse` / `sfx_floor_collapse.wav`       | 1.8 s low impact plus filtered debris; one combined cue.                                                                                                                                          |
| `sfx_sector_safe` / `sfx_sector_safe.wav`             | 0.8 s soft rising relay tone, not a victory fanfare.                                                                                                                                              |
| `amb_faultline` / `amb_faultline.wav`                 | 8 s seamless low industrial loop, no unpredictable bangs.                                                                                                                                         |
| `music_faultline` / `music_faultline.wav`             | 16 s restrained 60 BPM pulse bed, no melody competing with a host.                                                                                                                                |

Use existing shell ticks/lock-like clicks only where named above; map them explicitly in the cue sheet. Fallback background is a CSS navy radial gradient and four flat outlined sectors. Missing fracture assets fall back to a striped danger border plus the word DANGER. Missing icons retain text. Missing sound is silence. None changes event timing.

Reduced motion removes shake, perspective travel, dust and capsule bouncing. The conveyor uses a 200 ms crossfade between labeled start/end sector membership with direction text; collapse uses a 200 ms state change. The reveal still occurs at its original base-time boundary. No strobe or repeated full-screen flash in either mode. Keep status text high contrast and meaningful without color or audio.

## 8. Step-by-step build instructions

1. **Create the shared V4 contracts and constants.** Add all files in section 4.1, with typed interfaces for the later act modules from their specifications. Keep the existing production route active until all three real simulators and renderers pass the final release gate; never ship a placeholder winner.
2. **Implement setup routing and versions.** Lower the minimum, replace small-field copy, remove fake-out controls for V4, add fixed rules to the lock, and implement the old-session detection/export behavior. Test validation before starting presentation work.
3. **Implement seed derivation.** Test each namespace, seed normalization and stable output. Use existing rejection-sampled `SeededRng.nextInt` and Fisher–Yates `shuffle`; do not replace their internals.
4. **Implement the pure floor simulator.** Use section 2's call order exactly. Add immutable wave records and partitions. No React, DOM, Date, audio, or timing dependencies.
5. **Implement shared events and orchestration plumbing.** Give each act one input/output contract, initialize every entrant active, and build before/after snapshots. Until Acts 2/3 are implemented, exercise Act 1 through a development-only fixture route; do not expose an incomplete live giveaway.
6. **Implement the V4 clock and snapshot selection.** Add immediate pause, base-time offsets, idempotent skip, hidden-tab auto-pause, boundary controls and recovery. On returning from a hidden tab require Resume. Do not fast-forward through missed results.
7. **Implement IndexedDB storage and verification hooks.** Session-first persistence, queued checkpoints and explicit storage-failure status must work before integrating animated reveals. Recovery recomputes the commitment and exact simulation/timeline before enabling Resume; on mismatch keep the saved bytes downloadable and do not play them.
8. **Build the media generator and manifest.** Generate this act's assets and shared capsule usage, wire fallbacks, and add tests for expected IDs/paths and missing media.
9. **Build the four-sector stage.** Implement stable label layout, paging, warnings, movement and atomic collapse at the specified offsets. Use React keys based on entry IDs; duplicate labels cannot merge capsules.
10. **Wire cue sheets and accessibility.** Add correct cue offsets, mute, gain/ducking, reduced motion, high-contrast labels, and one live-region announcement per resolved wave. Do not announce every frame.
11. **Build the handoff.** Use actual survivor IDs/count; clear danger decoration at Act 2 entry; do not carry shields or any obsolete statuses into the race.
12. **Run the acceptance checks below.** Deliver Act 1 only when all its applicable checks pass. Complete the cross-act release gate in file 3 before switching new production sessions to V4.

## 9. Acceptance checks

### Engine and counts

- Empty input is rejected before locking; counts 1–16 skip without consuming floor RNG.
- Exercise every count 1–200 over 25 fixed seeds, and 201, 255, 256, 257, 999, 1000 over 100 seeds. Every played wave strictly decreases eligibility; final Faultline output for N>16 is 8–16.
- Sector sizes differ by at most one; two distinct sectors collapse; every input ID appears in exactly one sector and one result partition.
- At wave 2, verify `sectorsAfterShift[(s+rotationSteps)%4]` equals `sectorsBefore[s]`. At other waves arrays match and rotation is zero.
- Test all six collapsing-sector pairs and both conveyor directions using injected deterministic RNG fixtures. No name/entry order gets an explicit priority.
- The same seed/roster/config yields byte-identical engine events. Display-name-only changes leave ID outcomes unchanged. Cosmetic changes cannot consume outcome RNG.

### Presentation and persistence

- Inspect a normal wave immediately before and after `resolutionBaseMs`; every affected status changes once, together. Skip at each segment gives the same after state.
- Pause during conveyor movement and collapse, wait, and resume: no motion/score advancement while paused and no duplicated impact cue.
- Refresh before warning, during conveyor, just before resolution, and after resolution; restore paused at the last checkpoint with identical eligibility.
- Test 21, 33, 48, 61, 101 and 1000 entries visually. Every name appears during assignment paging; counts always represent the whole sector, not just visible tiles.
- Test 1920×1080 and 1280×720, plus a 360 px host viewport with letterboxing and usable external controls. Large rosters do not shrink names below the stated logical size.
- Unicode/emoji/long names and allowed duplicate names remain distinct entries. Rendering uses text nodes, not entrant-supplied HTML.
- Muted audio, missing all new assets, reduced motion and storage failure do not prevent reaching Act 2.
- No serial name draw, card rescue, fake elimination, or forced target adjustment appears.

## 10. Definition of done and handoff

Faultline outputs only its actual survivors and a fully auditable wave history. It must not assume a twelve-player race. Act 2 receives 5–16 entries on a race route, or the unchanged 1–4 entries on a skipped route. The shared foundation is implemented once, with these exact rules and media contracts. Proceed to [Act 2 — Escape Run](ACT_2_ESCAPE_RUN_BUILD_SPEC.md).
