# CAPSULE CHAOS — Phased Codex Implementation Prompt Sequence

This file converts `CAPSULE_CHAOS_planner.md` into a one-phase-at-a-time Codex workflow.

## Recommended workflow

1. Put `CAPSULE_CHAOS_planner.md` at the repository root and keep it there for all phases.
2. Start with Phase 01 and do not skip phases.
3. Paste only one phase prompt into Codex at a time.
4. Let Codex finish implementation, tests, typecheck/build, and its implementation report.
5. Review the result before pasting the next phase.
6. Do **not** ask Codex to commit or push; the prompts explicitly prohibit both.
7. Recommended model/effort:
   - Phases 01–05: **GPT-5.6 Sol / Max**
   - Phases 06–14: **GPT-5.6 Sol / High**
   - Phases 15–18: **GPT-5.6 Sol / High**
   - Final repository review: **GPT-5.6 Sol / Max**

## Phase map

| Phase | Work                            | Model       | Effort |
| ----: | ------------------------------- | ----------- | ------ |
|    01 | Project Skeleton                | GPT-5.6 Sol | Max    |
|    02 | Entry Import / Validation       | GPT-5.6 Sol | Max    |
|    03 | Seed / Commitment               | GPT-5.6 Sol | Max    |
|    04 | Core Headless Engine            | GPT-5.6 Sol | Max    |
|    05 | Timeline Generator              | GPT-5.6 Sol | Max    |
|    06 | Base Gachapon Animation         | GPT-5.6 Sol | High   |
|    07 | Phase 1 — The Purge             | GPT-5.6 Sol | High   |
|    08 | Card Presentation System        | GPT-5.6 Sol | High   |
|    09 | All V1 Chaos Cards              | GPT-5.6 Sol | High   |
|    10 | Phase 2 / Survivor Board        | GPT-5.6 Sol | High   |
|    11 | Phase 3 — Survival              | GPT-5.6 Sol | High   |
|    12 | Phase 4 — Final Five            | GPT-5.6 Sol | High   |
|    13 | Phase 5 — Final Fate            | GPT-5.6 Sol | High   |
|    14 | Final Two / Fake-Out Engine     | GPT-5.6 Sol | High   |
|    15 | Official Winner / Audit         | GPT-5.6 Sol | High   |
|    16 | Live Controls / Recovery        | GPT-5.6 Sol | High   |
|    17 | Astra Asset Integration         | GPT-5.6 Sol | High   |
|    18 | Performance / Production Polish | GPT-5.6 Sol | High   |
|    19 | Final Repository Review         | GPT-5.6 Sol | Max    |

---

# Phase 01 — Project Skeleton

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** Max

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 1 — Project Skeleton.

GOAL
Create the clean application foundation for CAPSULE CHAOS. This phase establishes the project, route structure, test tooling, and scalable 16:9 game stage. Do not implement giveaway logic yet.

REQUIRED DELIVERABLES
- If the repository is empty or not already an equivalent modern React app, initialize React + TypeScript + Vite.
- If an app already exists, adapt it rather than replacing working project structure without reason.
- Establish linting/formatting consistent with the repository.
- Establish a unit/component test framework (prefer Vitest; use React Testing Library where component tests are useful).
- Create routes/pages for:
  - `/setup`
  - `/game`
- Create a basic application shell and a fixed logical 16:9 game stage that scales to fit the browser viewport without stretching.
- Support at minimum 1920×1080 and 2560×1440 cleanly.
- Ultrawide viewports should letterbox/center the 16:9 stage rather than distort it.
- Create the major source folders anticipated by the planner:
  - `game/engine`
  - `game/cards`
  - `game/timeline`
  - `game/state`
  - `components`
  - `presentation`
  - `audio`
  - `assets`
  - `pages`
  - `tests`
- Add placeholder Setup and Game screens only.
- Create an asset directory/manifest placeholder; do not build Astra-specific production assets yet.
- Add a simple global error boundary or equivalent safe top-level error handling if appropriate for the chosen React setup.

DO NOT IMPLEMENT YET
- Entry parsing.
- RNG.
- Commitment hashing.
- Game simulation.
- Cards.
- Winner selection.
- Gachapon animation.
- Persistence.

ACCEPTANCE CRITERIA
- Local development server starts.
- `/setup` and `/game` render.
- Production build succeeds.
- TypeScript has no errors.
- Tests can run successfully.
- Stage preserves a 16:9 logical layout across common viewport sizes.
- No gameplay decisions exist in the UI.

TEST/VERIFY
Run the repository's lint/typecheck/test/build commands. Add a focused test for any utility used to calculate or enforce the stage aspect ratio if that logic is non-trivial.
```

---

# Phase 02 — Entry Import and Validation

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** Max

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 2 — Entry Import / Validation.

GOAL
Create the complete host entry-import experience. The host will paste one in-game name per line. Produce a validated internal roster without introducing gameplay randomness.

REQUIRED BEHAVIOR
- Add Giveaway Name input.
- Add a large entries textarea.
- Parse entries by line break.
- Trim surrounding whitespace.
- Ignore empty/whitespace-only lines.
- Preserve:
  - Unicode
  - capitalization
  - punctuation inside names
  - emoji where valid
- Assign each valid entry a stable internal unique ID; never use display name as the sole identity.
- Store original `displayName`, a normalization value suitable for duplicate detection, and original entry index.
- Detect duplicates.
- Default behavior: duplicates block Start.
- Provide an explicit `Allow duplicate entries` option.
- When duplicates are allowed, each repeated entry remains a separate unique player instance.
- Show:
  - total valid entries
  - duplicate warnings
  - blocking validation errors
- Target range: 30–60.
- Hard minimum: 8.
- Warn, but do not necessarily block, when below 20.
- Warn when above 100.
- Start must remain unavailable when validation has a blocking error.
- Add basic setup controls/placeholders required by the planner:
  - animation speed: Fast / Normal / Cinematic
  - Sound On/Off
  - Auto Advance Phases On/Off
  - Show full survivor board On/Off
  - Fake-out intensity: Low / Standard / High
- `Standard` fake-out intensity and Auto Advance OFF should be defaults.
- Define typed setup/config models that later phases can reuse.

NORMALIZATION
Use a clearly documented duplicate-normalization policy. It must not corrupt the displayed name. For example, trimming and a Unicode normalization form may be appropriate, while display text remains unchanged. Be conservative about case folding unless the planner/UI explicitly tells the host that names are treated case-insensitively.

DO NOT IMPLEMENT YET
- Seed generation.
- Commitment hash.
- Any random winner logic.
- Simulation.

ACCEPTANCE CRITERIA
- Pasting:
  `Alpha`, blank line, `Bravo`, `Charlie`
  produces 3 valid entries.
- Vietnamese and other Unicode names remain intact.
- Duplicate behavior is deterministic and clearly communicated.
- Start is blocked below the hard minimum and on accidental duplicates.
- Allowing duplicates produces distinct internal player IDs.
- Existing Phase 1 routing/stage behavior remains intact.

TEST CASES
Cover at least:
- blank lines
- leading/trailing spaces
- CRLF and LF
- Unicode/Vietnamese
- emoji
- duplicate names
- duplicates allowed
- very long names
- punctuation-heavy names
- minimum/target/warning count boundaries
```

---

# Phase 03 — Seed and Commitment System

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** Max

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 3 — Seed / Commitment System.

GOAL
Create the fairness foundation: secure seed generation, deterministic PRNG, canonical game-lock payload, and SHA-256 commitment. This phase is outcome-critical.

REQUIRED ARCHITECTURE
1. Initial seed:
   - Generate with browser `crypto.getRandomValues()`.
   - Use sufficient entropy (target 256 bits).
   - Do not use `Math.random()`.
2. Deterministic PRNG:
   - Implement or use a small auditable seeded PRNG appropriate for deterministic simulation (for example xoshiro/xoroshiro class quality).
   - The PRNG must provide deterministic primitives needed later:
     - next integer/range
     - shuffle
     - choose one
     - weighted choice
   - All primitives need clear inclusive/exclusive range semantics.
3. Canonical lock payload:
   - Define a stable serialization containing:
     - normalized/locked entries in deterministic order
     - game configuration
     - seed
   - Ensure object key/order ambiguity cannot cause different hashes for logically identical locked payloads.
4. Commitment:
   - SHA-256 through Web Crypto `SubtleCrypto.digest()`.
   - Provide machine-readable full hash plus a short display form.
5. Seed lifecycle:
   - Seed is generated and retained at Start/lock time.
   - Public UI can show commitment immediately.
   - Actual seed must not be shown in normal live-game presentation until the game is complete.
   - Do not implement final audit UI yet; expose typed functions/state required by later phases.

DETERMINISM REQUIREMENT
Same:
- normalized entry roster
- game config
- seed
must always produce the same PRNG stream and commitment.

SECURITY/BOUNDARY REQUIREMENT
The secure browser seed generation is only for creating the initial seed. After lock, result-producing choices must flow through the deterministic seeded PRNG.

TESTS
Add strong deterministic tests:
- Same seed => exact same known sequence.
- Different seeds => normally different sequences.
- Shuffle is reproducible.
- Weighted choice is reproducible.
- Range operations never exceed documented bounds.
- Commitment is identical for identical canonical payloads.
- Commitment changes if seed, entry list, or config changes.
- Unicode entry serialization is stable.
- At least one fixed test vector should assert an exact expected hash/PRNG sequence so accidental algorithm changes are caught.

ACCEPTANCE CRITERIA
- No outcome-related `Math.random()` usage.
- Secure seed generation exists.
- Commitment is SHA-256.
- Deterministic primitives are typed and independently testable.
- Build, typecheck, and full test suite pass.

Do not silently replace the PRNG algorithm later. Treat the algorithm and canonical serialization format as versioned game rules once this phase passes.
```

---

# Phase 04 — Core Headless Game Engine

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** Max

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 4 — Core Game Engine.

GOAL
Create a pure, UI-independent, deterministic game engine capable of driving a complete baseline CAPSULE CHAOS match from locked roster to exactly one winner. The full special-card catalog is NOT required yet; the architecture must support it cleanly.

REQUIRED DATA MODEL
Implement/refine typed structures for:
- Player:
  - stable ID
  - displayName
  - normalizedName
  - entryIndex
  - state
  - shield charges
  - second-life charges
  - optional phase lock/protection
  - elimination count
  - revival count
  - history
- GameConfig
- GameState
- Phase identity/status
- Engine-level events/results
- Card/effect interfaces/registry hooks

PLAYER STATES
Support the planner's meaningful states, such as:
- active
- safe
- eliminated
- revived
- finalist
- winner

CORE RULES
- Implement adaptive phase target calculation from the planner.
- Implement baseline capsule selection/draw logic through the deterministic PRNG.
- Implement standard elimination and safe resolution.
- Implement reusable protection/revival primitives even if only minimally exercised now.
- Implement target selectors that cannot:
  - pick ineligible players
  - pick the same participant twice when uniqueness is required
  - treat eliminated players as active unless explicitly revived
- Add convergence safeguards.
- Add hard event cap concept; use planner target `MAX_GAME_EVENTS = 500` unless repository constraints justify a typed equivalent.
- Create a card-effect registry abstraction so Phase 7/9 can add cards without putting card logic inside React.
- Create eligibility/fallback hooks for effects.

BASELINE FULL SIMULATION
At the end of this phase, a headless simulation must be able to:
- start from 30–60 players
- move through the planned phase boundaries using baseline elimination/safe behavior
- terminate with exactly one winner
- record state/history sufficient for the next timeline phase

Do not fake later visual twists yet.

IMPORTANT
Do not put animation durations, CSS, React components, sounds, or DOM concepts in the engine.

TESTS
Run many deterministic simulations across starting sizes:
- 8
- 20
- 30
- 48
- 60
- 100

For at least 1,000 generated games across the primary 30–60 range, assert:
- exactly one winner
- simulation always terminates under the hard event cap
- no invalid active references
- counts never become negative
- eliminated players stay ineligible unless revived
- phase progression converges
- same seed + roster + config produces identical final engine result/history

ACCEPTANCE CRITERIA
- Complete baseline headless match works without React.
- Engine owns WHAT happens.
- RNG decisions occur only through the seeded RNG abstraction.
- Special-card integration points are clean and typed.
- Build/tests pass.
```

---

# Phase 05 — Deterministic Event Timeline

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** Max

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 5 — Timeline Generator.

GOAL
Separate game outcomes from presentation by converting the completed deterministic simulation/engine decisions into an immutable renderable event timeline.

REQUIRED MODEL
Create/refine a typed `TimelineEvent` shape containing at least:
- stable event ID
- sequence number
- phase
- event type
- participant IDs
- typed/validated payload
- `presentationKey`
- minimum duration metadata where appropriate

Support event categories needed by the planner, even if some will not be emitted until later:
- capsule spin
- player reveal
- elimination
- safe
- card reveal
- shield/protection
- revival
- duel
- phase transition
- fake-winner presentation
- final-fate
- winner

ARCHITECTURE
Correct flow must be:
`Seed -> Engine/Simulation -> Resolved outcomes -> Timeline -> Renderer`

The timeline layer may decide presentation ordering and group already-resolved events, but it must NOT make new result-affecting random choices.

Create a clear contract for the future presentation registry:
- timeline emits `presentationKey`
- UI resolves that key to an animation/presentation implementation

AUDIT PREPARATION
Retain enough deterministic event data that Phase 15 can export the complete audit event stream without reconstructing outcomes from visual components.

IMMUTABILITY
Once the locked game timeline has been generated, later UI playback must treat outcome fields as immutable. Pause/skip/replay visuals must never mutate the resolved outcome.

TESTS
- Same locked game input produces identical serialized timeline.
- Timeline event sequence numbers are unique and ordered.
- Participant IDs always refer to known players.
- Timeline winner matches engine winner.
- No timeline generation calls browser/global randomness for results.
- Playback metadata changes must not alter outcome fields.
- Generate timeline for representative 30, 48, and 60-player games.

ACCEPTANCE CRITERIA
- A complete baseline game can be generated before rendering starts.
- Renderer could theoretically play the whole match without asking the engine for another random result.
- All existing deterministic engine tests remain green.
- Build passes.

Do not implement elaborate React animations in this phase.
```

---

# Phase 06 — Base Gachapon Animation

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 6 — Base Gachapon Animation.

GOAL
Build the reusable visual presentation for a standard capsule draw using placeholder/original assets. Presentation must consume existing timeline events and must not choose outcomes.

REQUIRED VISUAL SEQUENCE
For a normal draw:
1. Machine begins subtle shake/rotation.
2. Capsules swirl/tumble visually.
3. Selected capsule drops into the chute.
4. Camera/UI focus moves toward the selected capsule.
5. Capsule spins.
6. Capsule opens with a pop.
7. Player name card rises/reveals.
8. Presentation resolves to a stable end state ready for the next timeline event.

TIMING PROFILES
Support planner speed modes:
- Fast
- Normal
- Cinematic

Use centralized timing constants/config rather than scattering magic numbers across components.

REQUIRED COMPONENTS
Create/refine reusable components such as:
- GachaponMachine
- Capsule
- PlayerReveal
- game-stage presentation host/event renderer

Use placeholder graphics/CSS shapes where Astra production assets do not exist.

CONTROL COMPATIBILITY
Design animations so later Pause/Resume/Skip can be integrated cleanly.
For now, expose an explicit completion promise/callback/state rather than chaining arbitrary `setTimeout` calls.

IMPORTANT
- The selected player must come from the timeline event payload.
- Do not shuffle or choose capsules in the animation component.
- Decorative visual randomness must never change the selected result. Prefer deterministic/cosmetic animation patterns.
- Respect the 16:9 show stage.
- Large player names must remain readable on 1080p screen share.

TEST/VERIFY
- Render a known fixed timeline draw and verify the shown player matches the event payload.
- Verify Fast/Normal/Cinematic use different centralized durations.
- Verify animation completes reliably after repeated runs.
- Build/test at 1920×1080 logical stage and a smaller browser viewport.

ACCEPTANCE CRITERIA
A single precomputed draw event can play from machine spin through readable name reveal without the presentation layer making any gameplay decision.
```

---

# Phase 07 — Phase 1 — The Purge

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 7 — PHASE 1: THE PURGE.

GOAL
Create the first complete live phase. A typical 30–60 player game should autoplay from the starting pool down to Phase 1 target without host input.

PHASE TARGET
Use the planner's target logic:
- normally reduce to 20
- for smaller games use approximately `ceil(startingPlayers * 0.4)`
- minimum target 12 where applicable
Reuse the engine's established phase rule implementation; do not duplicate target math in React.

PHASE 1 CARDS
Implement the Phase 1 card subset end-to-end if not already implemented:
- Shield
- Second Life
- Double Trouble
- Revive
- Reverse
- Lucky Escape

The effect logic belongs in the engine/card layer.
The timeline expresses the resolved effect.
The UI only presents it.

FREQUENCY
Use deterministic config/weights consistent with the planner:
- roughly one Chaos event every five completed eliminations / about 20% target behavior
- do not hardwire UI counters as the source of truth if the engine already resolved the sequence

REQUIRED PRESENTATION
- Phase 1 intro/title.
- Automatic draw loop.
- Standard elimination animation:
  - player reveal
  - brief hold
  - red slash/crack/smoke style placeholder presentation
  - clear `ELIMINATED`
- Always-visible or clearly recurring remaining-player count.
- Card interrupts when a Phase 1 card triggers.
- Phase completion screen:
  `PHASE I COMPLETE`
  `<N> SURVIVORS`
  `THE EASY PART IS OVER.`
- Stop automatically at phase boundary.
- Do not auto-enter Phase 2 unless Auto Advance Phases is enabled in config.

CARD EDGE BEHAVIOR
- Revive cannot target nobody; apply engine-defined eligibility/fallback.
- Double Trouble must choose valid distinct active targets.
- Reverse must follow the planner's defined current-elimination rescue/next-mark behavior.
- Protection consumption must be deterministic.
- No Legendary card in standard Phase 1.

TESTS
Add engine tests for each Phase 1 card plus integration simulations.
For representative 30/48/60-player seeds:
- Phase 1 always reaches the intended target.
- No invalid target is generated.
- Autoplay stops exactly at phase completion.
- UI's displayed survivor count derives from resolved state/timeline.

ACCEPTANCE CRITERIA
A 50-player seeded game can run Phase 1 hands-free to 20 survivors with standard eliminations and Phase 1 card effects, then wait at the completion screen.
```

---

# Phase 08 — Reusable Chaos Card Presentation

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 8 — Card Presentation System.

GOAL
Build one reusable data-driven visual system for Chaos Cards. Do not put individual gameplay decisions in card components.

RARITY TIERS
Implement distinct presentation variants:

COMMON
- silver/white feel
- simple flip
- short impact
- target ~1.5–2 sec

RARE
- stronger blue/purple-style energy treatment
- two-stage reveal
- particles
- target ~2.5–3 sec

EPIC
- screen darkening
- radial burst
- 3D-style card turn
- stronger impact
- target ~3–4 sec

LEGENDARY
- brief darkness
- heartbeat/charge
- silhouette/energy buildup
- high-impact reveal
- target ~5–7 sec

Do not hardcode exact color values if the project theme system already handles styling. Preserve the visual hierarchy.

REQUIRED ARCHITECTURE
- `ChaosCardDefinition` remains engine/data focused.
- Presentation config maps card/rarity/presentationKey to UI.
- Card component receives already-resolved:
  - card ID/name
  - rarity
  - target/result text
  - description
  - presentation key
- Add a readable one-sentence effect explanation during/after reveal.
- Card text must remain dynamic HTML/React text, not baked into image assets.
- Centralize animation durations.
- Provide placeholder frames/assets for all four rarities.
- Prepare hooks for future audio cues through the central audio layer, without coupling gameplay to sound.

TESTS
- Render one known card from each rarity.
- Unknown presentation keys fall back safely to a generic card presentation.
- Long card names/descriptions remain readable.
- Skip/end-state API can force card animation to its resolved state for later Phase 16 controls.
- No card presentation code mutates player/game state.

ACCEPTANCE CRITERIA
A new card can be visually supported by adding/adjusting definition + presentation mapping instead of creating a new game-flow architecture.
```

---

# Phase 09 — All V1 Chaos Cards

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 9 — All V1 Chaos Cards.

GOAL
Complete the deterministic engine behavior, eligibility rules, timeline representation, tests, and presentation mapping for the full V1 card catalog.

REQUIRED CARDS
1. Shield
2. Second Life
3. Double Trouble
4. Revive
5. Reverse
6. Lucky Escape
7. Mirror
8. Chaos Bomb
9. Duel
10. Steal
11. Nullify
12. Final Pass
13. Ghost Return
14. Fate Swap
15. System Override
16. Jackpot

Use the exact conceptual behavior and phase eligibility from `CAPSULE_CHAOS_planner.md`.

CRITICAL IMPLEMENTATION NOTES
- Mirror:
  redirect current elimination to a valid random active target; original survives; new target still resolves protection normally.
- Chaos Bomb:
  current participant + two valid active participants; base outcome is one survivor/two eliminated, then valid passive protection can modify individual elimination results according to the planner.
- Duel:
  valid distinct opponent; deterministic winner; losing elimination still respects allowed protection.
- Steal:
  target only players with stealable Shield/Second Life; if none exist, deterministically resolve the planner's Lucky Escape fallback.
- Nullify:
  constrain V1 to valid reversible preceding events listed in the planner. Do not create arbitrary state rollback.
- Final Pass:
  immune until next phase boundary; clear/expire protection at correct transition.
- Ghost Return:
  implement the planner's V1 simplification if needed: revived with no stored protection. If implementing Fragile, fully test it and ensure rules are explicit.
- Fate Swap:
  deterministic valid replacement target; do not make it an uncontrolled duplicate of Mirror logic.
- System Override:
  deterministic sub-effect from the allowed seeded pool; no host selection.
- Jackpot:
  default `allowDoubleWinner = false`.
  With default config it must NOT create a second official prize winner.
  In normal mode, implement survival/revival behavior from the planner.
  Only support double-winner final behavior if configuration explicitly allows it.

RARITY/PHASE RULES
Respect phase eligibility:
- no casual Legendary events early
- Final 10 onward for System Override
- Final 5 onward for Jackpot
- overall Legendary caps from planner/config

ELIGIBILITY/FALLBACK
Every card must have explicit:
- `canApply(...)`
- valid target selection
- deterministic fallback/no-op behavior where appropriate

Do not allow impossible card states.

TESTS
Unit test every card.
Add combination tests for high-risk interactions:
- Shield + Mirror
- Second Life + Duel
- Revive then re-eliminate
- Steal with and without eligible targets
- Final Pass across phase boundary
- Nullify after each supported reversible event
- Chaos Bomb with protections
- System Override sub-effects
- Jackpot with `allowDoubleWinner` off
- repeated revival cap
- card eligibility near low player counts

SIMULATION
Re-run large deterministic simulations across 30–60 players. Target at least 1,000 complete games with all V1 cards enabled.
Assert:
- exactly one official winner by default
- game terminates
- phase targets converge despite revivals
- no invalid participants
- no infinite revive/Nullify loops
- Legendary cap holds

ACCEPTANCE CRITERIA
All 16 cards are implemented and no generated card can place the game in an invalid or non-terminating state.
```

---

# Phase 10 — Phase 2 and Survivor Board

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 10 — PHASE 2 / SURVIVOR BOARD.

GOAL
Create `CHAOS AWAKENS`, reduce the standard Phase 2 pool from ~20 to 10, and give the audience a clear visual roster of who remains.

SURVIVOR BOARD
Implement a responsive roster that derives entirely from resolved game state:
- around 20 players: compact grid, roughly 4–5 columns depending on stage width
- 10 or fewer: larger tiles

Required visible states:
- Active
- Protected (Shield/Second Life icon/charge where relevant)
- Marked/danger
- Eliminated (brief gray/red/struck transition before removal/fade)
- Revived (`RETURNED` tag/pulse briefly)
- Phase-locked/Final Pass protection where relevant

Do not rely only on red vs green. Use icon/text/status shape too.

PHASE 2 INTRO
Presentation:
- display all survivors
- dim stage
- communicate `THE RULES ARE CHANGING`
- show face-down Chaos Card motif
- title:
  `PHASE II`
  `CHAOS AWAKENS`

PHASE 2 RULES
- Standard target: 10.
- Slower pacing than Phase 1.
- Chaos frequency roughly 35% / every 2–3 eliminations as configured by deterministic engine.
- Allow Common, Rare, selected Epic cards.
- Legendary normally disabled in Standard intensity for this phase.
- Reuse the complete card engine from Phase 9; do not duplicate card rules in UI.

AUTOPLAY
Phase runs automatically until target is reached, respecting animation completion.
Then show:
`10 REMAIN.`
`FROM THIS POINT, EVERY CAPSULE MATTERS.`
and wait for Next Phase unless auto-advance is enabled.

TESTS
- Survivor board accurately reflects seeded state transitions.
- Protection markers appear/disappear with engine state.
- Revived players return correctly.
- Phase always converges to target despite card effects.
- No stale eliminated tile can be selected by future UI presentation as if active.
- Phase completion stops advancement.

ACCEPTANCE CRITERIA
Audience can track all remaining players and their important status while Phase 2 automatically reaches 10 survivors.
```

---

# Phase 11 — Phase 3 — Survival

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 11 — PHASE 3: SURVIVAL.

GOAL
Make the 10 → 5 segment materially slower, darker, and more suspenseful while preserving deterministic outcomes.

PHASE RULES
- Start near 10 active players.
- End at 5.
- Chaos chance approximately 45% under Standard balance.
- Epic effects may appear.
- Use existing deterministic engine/card eligibility and Legendary caps.

PRESENTATION
Create a distinct Survival visual mode:
- darker arena treatment
- larger central capsule
- less background motion
- stronger spotlight
- enlarged survivor tiles around/near stage edges
- always-readable remaining count

PER-DRAW PACING
Target Normal/Cinematic behavior consistent with planner:
1. Show remaining count.
2. `NEXT FATE`
3. slow machine movement/spin
4. capsule drop
5. player reveal
6. ~0.8–1.5 sec suspense hold
7. resolve elimination/safe/card
8. update survivor board
9. reaction window before next automatic event

NEAR-MISS PRESENTATION
Implement an occasional timeline/presentation-only near-miss:
- one visual capsule appears to almost enter the chute, then bounces away
- the already-resolved selected capsule then drops
- it MUST NOT call RNG in the component to change the selected player
- if whether a near-miss occurs is randomized, that presentation decision must be precomputed deterministically and must not affect game outcome

PHASE COMPLETION
At 5:
`FINAL FIVE`
`THE RULES ARE ABOUT TO CHANGE.`
Wait for Next Phase unless auto-advance is enabled.

TESTS
- 10 → 5 always converges.
- Near-miss cannot alter selected player.
- Survivor count/state remains correct across Epic effects and revivals.
- Animation speed modes scale pacing without altering event sequence.
- Phase completion is stable under Skip/end-state behavior.

ACCEPTANCE CRITERIA
Phase 3 feels visibly and temporally different from early rounds but consumes the exact same precomputed outcome timeline.
```

---

# Phase 12 — Phase 4 — Final Five Rule Reversal

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 12 — PHASE 4: FINAL FIVE RULE REVERSAL.

GOAL
Reverse audience expectations: in this phase, the capsule drawn is SAFE. Reduce Final Five to Final Three using the planner's deterministic rules.

RULE ANNOUNCEMENT
Before the first draw, clearly display:
`NEW RULE`
`FROM NOW ON...`
`THE CAPSULE DRAWN IS SAFE`

The audience must not be able to misunderstand this rule.

GAME LOGIC
- The engine/timeline must explicitly model a `safe draw` for this phase.
- Do not invert the rule merely inside the UI.
- Selected safe players leave the current danger pool and advance.
- Use the planner's chosen V1 structure consistently.
Recommended implementation:
  1. Begin with five.
  2. Deterministically select safe players.
  3. Continue until the Final Three are resolved.
If implementing the optional last-two sudden death, it must be fully deterministic and consistent with the master planner. Do not mix two rule variants in one game.

PRESENTATION
First safe draw should exploit learned expectation without lying:
- use brief red anticipation lighting for ~0.8 sec
- snap to green/safe reveal
- show `SAFE`
- never show `ELIMINATED` for a player who is actually safe

Subsequent draws may keep suspense but must maintain clear rule status on-screen.

STATE
Final Three must be clearly promoted to finalist state/pedestals ready for Phase 5.

TESTS
- Exactly three finalists emerge.
- Drawn safe players are never processed as eliminated by presentation.
- Protections/cards cannot create impossible counts.
- Refreshing/re-rendering state does not reinterpret safe draws.
- Same seed produces same Final Three.

ACCEPTANCE CRITERIA
The rule reversal is explicit, deterministic, and visually surprising without presenting a false official game state.
```

---

# Phase 13 — Phase 5 — Final Fate

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 13 — PHASE 5: FINAL FATE.

GOAL
Resolve Final Three to Final Two with a distinct high-stakes sequence and at most one major twist opportunity.

LAYOUT
- Three finalist capsules/panels on prominent pedestals.
- Clearly identify the stage as `FINAL FATE`.
- Remove clutter from prior survivor board layout.

ALLOWED FINAL-FATE OUTCOMES
Use the deterministic weighted/eligible pool described by the planner:
- normal elimination
- Reverse
- Duel
- System Override
- revival challenge
- Fate Swap

Enforce:
- maximum one Legendary event in this phase
- valid target rules
- convergence to exactly two finalists

SEQUENCE
1. Three finalists visible.
2. Resolve selected participant/event from precomputed timeline.
3. Present `FINAL FATE CHECK`.
4. Reveal the already-resolved card/outcome.
5. Apply/animate effect.
6. Clearly show which two players advance.

If Reverse/Fate Swap requires a replacement elimination target, that replacement must already be resolved by the engine/timeline.
If Duel occurs, deterministic winner/loser must already be known.
If a revival challenge occurs, ensure it cannot leave an unresolved player count.

HANDOFF
End with a stable Final Two state consumable by the final chamber in Phase 14.

TESTS
- Every allowed Final Fate branch reaches exactly two finalists.
- No ineligible Legendary/card appears.
- No same-player duel.
- Replacement targets are valid and deterministic.
- Final Two IDs match engine/timeline outcome.
- Same seed reproduces same branch and finalists.

ACCEPTANCE CRITERIA
Final Three feels unique and dramatic, and always resolves deterministically to exactly two finalists.
```

---

# Phase 14 — Final Two and Fake-Out Engine

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 14 — FINAL TWO / FAKE-OUT ENGINE.

GOAL
Create the most dramatic presentation of the giveaway while guaranteeing that theatrical fake-outs cannot alter the precomputed official result.

FINAL CHAMBER
- Two large finalist panels.
- Separate visual final capsule chamber.
- Music/tension state changes.
- Heartbeat sequence.
- Countdown:
  `3`
  `2`
  `1`
- Precomputed final capsule/event reveals.

FAKE-OUT VARIANTS
Implement reusable presentation sequences for the seeded final-fate presentation:
A. False Celebration
B. Error / Recalculation
C. Capsule Refuses to Open
D. Double Reveal

Use the exact concepts from the planner.

CRITICAL FAIRNESS RULE
The fake-out system receives a resolved final outcome/timeline.
It may control:
- animation
- temporary presentation text
- glitch timing
- audio
It may NOT:
- call gameplay RNG
- swap the final winner
- choose a new target
- reroll
- invoke a host override

OFFICIAL LANGUAGE
Reserve `OFFICIAL WINNER` for Phase 15's irreversible result.
A theatrical false celebration may use `WINNER` as defined by the planner, but it must visibly transition to `RESULT NOT FINAL`/equivalent before the official result.
Never display `RESULT VERIFIED` during a fake-out.

FAKE-OUT INTENSITY
Respect Low / Standard / High config by changing which precomputed presentation variants are eligible/frequent. Do not let intensity change fairness or allow manual host choice.

ROBUSTNESS
Animation interruption, re-render, or Skip must land on the correct resolved next state.
Do not let a skipped fake-out accidentally skip the official result event.

TESTS
- For each fake-out type, final winner ID remains identical to engine winner.
- Skip/end-state proceeds to correct next timeline event.
- Low/Standard/High do not change a fixed engine winner when using equivalent locked outcome configuration rules.
- Final presentation makes no gameplay RNG calls.
- Refresh/replay preparation does not generate a different final result.

ACCEPTANCE CRITERIA
All final fake-outs are visually distinct, seeded, replayable from the timeline, and incapable of changing the official result.
```

---

# Phase 15 — Official Winner and Audit

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 15 — TRUE WINNER / AUDIT.

GOAL
Finish the giveaway with an unmistakable official result and provide a verifiable audit package containing the original seed, commitment, configuration, entries, and resolved event sequence.

TRUE WINNER PRESENTATION
Required:
- full-screen high-impact winner reveal
- winner name remains visible for at least ~6 seconds in normal/cinematic flow
- explicit text:
  `OFFICIAL WINNER`
- champion/gold capsule treatment
- crown/pedestal/confetti placeholder effects
- `RESULT VERIFIED` only after verification succeeds
- this screen must be visually distinct from Phase 14 fake-outs

SEED REVEAL
After the official result:
- display full seed
- display commitment
- recompute/verify the commitment from the locked payload
- show a clear verified/failed status
- do not silently call a failed verification "verified"

AUDIT DATA
Create a typed audit document containing at least:
- schema/version
- timestamp
- giveaway name
- original locked entry list with stable IDs/indexes as appropriate
- normalized/canonical data necessary to verify
- configuration
- PRNG/game rules version
- seed
- commitment hash
- deterministic event sequence / timeline or sufficient resolved audit event stream
- eliminations
- revivals
- cards
- phase transitions
- official winner

AUDIT UI
Provide:
- View Audit Log
- Copy audit JSON
- Download audit JSON

Suggested filename:
`capsule-chaos-audit-YYYY-MM-DD.json`
Include a collision-safe suffix if needed.

VERIFY/REPLAY UTILITY
Create a pure verification helper that can take the audit payload and verify at least:
- commitment
- winner consistency with recorded resolved timeline/simulation data
If full resimulation verification is practical with current architecture, implement it; otherwise structure the versioned audit so it can be added without breaking format.

TESTS
- Known locked payload verifies.
- Tampered seed fails commitment.
- Tampered config/entry list fails commitment.
- Audit winner equals engine winner.
- JSON export is valid and complete.
- Unicode names round-trip.
- Fake-winner text never sets the official winner state.
- `RESULT VERIFIED` only appears after successful verification.

ACCEPTANCE CRITERIA
The show ends with exactly one official winner by default and a downloadable audit that exposes the seed/commitment and resolved event history.
```

---

# Phase 16 — Live Controls and Refresh Recovery

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 16 — PAUSE / RESUME / SKIP / RECOVERY.

GOAL
Make CAPSULE CHAOS safe to operate during a live Discord/Zoom/Teams screen share without allowing controls to alter outcomes.

CONTROLS
Implement:
- Pause
- Resume
- Skip Animation
- Next Phase
- Emergency Reset
- keyboard shortcuts:
  - Space = Pause/Resume
  - N = Next Phase
  - S = Skip Animation
  - F = Fullscreen/show mode request where browser permits
  - M = Mute
- No single-key Emergency Reset.

SEMANTICS
Pause:
- safely stop advancement after current atomic animation/event boundary, or freeze animation if the chosen animation stack supports reliable pause.
- It must not re-resolve the event.

Skip Animation:
- immediately drive current presentation to its already-resolved end state.
- Do NOT remove/skip the underlying timeline event.
- Do NOT jump over official winner/audit state.

Next Phase:
- enabled only after current phase is complete.
- if Auto Advance Phases is ON, phase transitions may proceed automatically using the same resolved timeline.

Emergency Reset:
- require deliberate confirmation, e.g. 3-second hold or typed `RESET`.
- make clear that it abandons the current live session; it is not a reroll button.

PERSISTENCE/RECOVERY
Persist enough state in localStorage or IndexedDB to recover:
- locked entries
- seed
- commitment
- configuration
- precomputed timeline
- current event index
- player/game state required for current presentation
- phase
- official winner if already resolved

On reload with an active session:
`Active giveaway found`
`[RESUME GIVEAWAY]`
`[ABANDON SESSION]`

Resume must use the same seed/timeline and result.

SHOW MODE
Implement `ENTER SHOW MODE`:
- hide setup/admin clutter
- maximize 16:9 stage
- disable accidental text selection
- optionally hide cursor after inactivity
- browser fullscreen request where permitted
- maintain essential keyboard controls
Do not block normal browser Escape behavior.

ROBUSTNESS TESTS
Cover:
- pause during capsule draw
- pause during card reveal
- skip during revive
- skip during fake-out
- refresh during Phase 3
- refresh during Final Two fake-out
- refresh after official winner
- tab loses focus
- storage unavailable/fails
- recovery of Unicode names

ACCEPTANCE CRITERIA
Reloading or pausing a live giveaway cannot change the seed, event sequence, finalists, or official winner.
```

---

# Phase 17 — Astra Asset Integration

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 17 — ASTRA ASSET INTEGRATION.

GOAL
Make all production visual/audio assets replaceable through centralized manifests/adapters so Astra can create assets independently of gameplay code.

DO NOT REQUIRE FINAL ASTRA FILES
If production assets are not present yet, keep functioning placeholders and build the integration contract now.

ASSET STRUCTURE
Implement/align with the planner's categories:
- background
- machine
- capsules
- cards
- effects
- icons
- audio

Create a typed central asset manifest. Components should import logical asset IDs/manifest entries rather than hardcoded ad-hoc paths scattered through JSX/CSS.

EXPECTED NAMING/CONTRACT
Support names consistent with planner examples such as:
- `bg_arena_main`
- `bg_arena_final`
- `gachapon_base`
- `gachapon_glass`
- `gachapon_chute`
- capsule color variants
- gold capsule
- card back
- Common/Rare/Epic/Legendary frames
- elimination slash
- shield hit
- revival
- reverse
- glitch
- legendary burst
- confetti
- card/status icons
- core SFX

FORMATS
Prefer integration support for:
- WebP/PNG/SVG static images
- WebM transparent animated effects where supported
- Lottie only if a lightweight existing choice fits the project
- OGG/WebAudio-compatible audio through centralized AudioManager
Avoid GIF-first design.

FALLBACKS
- Missing visual asset => safe placeholder, not broken UI.
- Missing audio => silent continuation, not a crashed event.
- Asset load failure must never alter game outcome or timeline advancement semantics.

PRELOADING
Add an asset preloader for critical show assets:
- machine
- capsule
- card frames
- elimination
- final winner essentials
Do not block indefinitely; handle failed asset loads.

ASTRA HANDOFF MAP
Create a concise repository document such as `ASTRA_ASSET_MAP.md` that maps:
- logical asset ID
- expected filename/path
- purpose
- recommended dimensions/canvas
- loop/no-loop
- transparency requirement
- which phase/card uses it

Use the planner's detailed card/action animation descriptions as the source of truth. Do not redesign them.

AUDIO
Route SFX/music requests through the centralized audio service.
Global mute must work.
Gameplay must continue if audio cannot autoplay due to browser restrictions.

TESTS
- Missing asset fallback.
- Audio failure/mute.
- Preload success/failure.
- Asset manifest lookup.
- No component directly changes outcome based on asset load status.

ACCEPTANCE CRITERIA
Astra can drop replacement files into documented locations/update a small manifest without touching game engine/timeline code.
```

---

# Phase 18 — Performance and Production Polish

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** High

```text
You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


CURRENT PHASE
Implement BUILD STEP 18 — PERFORMANCE / POLISH.

GOAL
Prepare CAPSULE CHAOS V1 for real 1080p screen sharing and production static deployment without changing gameplay rules.

PERFORMANCE
Profile and improve:
- unnecessary React renders
- survivor board updates
- large animation layers
- layout thrashing
- synchronous blocking work during playback
- excessive asset sizes
- audio initialization
- startup/preload path
- memory retained from completed phases

Target smooth 60 FPS where practical on a modern desktop, especially:
- capsule reveal
- card flip
- final fake-out
- official winner

Do not sacrifice deterministic correctness for animation speed.

LAYOUT/RESPONSIVENESS
Verify:
- 1920×1080
- 2560×1440
- common smaller browser windows
- ultrawide with centered/letterboxed 16:9 stage
- long player names
- 20-player survivor board
- 10-player enlarged board
- fullscreen/show mode

ACCESSIBILITY/POLISH
Verify/finish:
- Reduced Motion option
- global mute
- non-color-only status indicators
- readable contrast
- keyboard controls
- no tiny critical text
- cursor/show-mode behavior
- asset loading states
- clear phase labels and remaining-player count

PRODUCTION SAFETY
Ensure:
- dev/debug manipulation UI is excluded from production
- no production reroll/force-winner controls
- no accidentally exposed seed before game completion
- no `Math.random()` result logic
- errors are visible but do not silently select alternate winners
- static production build works when served from intended host/base path
- direct navigation/routing behavior is appropriate for chosen static deployment strategy

FULL TEST MATRIX
Exercise entry sizes:
- 8
- 20
- 30
- 48
- 60
- 100

Run the complete automated suite plus large deterministic simulations with all V1 cards.
Test special edge cases from Sections 39–42 of the master planner.

PERFORMANCE DOCUMENTATION
Add a concise production/readiness note documenting:
- build command
- output directory
- recommended static hosting assumptions
- asset size considerations
- supported browsers if the project defines them
- known non-blocking limitations

ACCEPTANCE CRITERIA
- Production build passes.
- Test suite passes.
- Core show is smooth and readable at 1080p.
- No phase deadlocks.
- Exactly one official winner by default.
- No outcome changes under Fast/Normal/Cinematic, mute, reduced motion, pause, skip, or refresh recovery.
- V1 Definition of Done in the planner is satisfied or any genuine exception is clearly documented.
```

---

# Phase 19 — Final Repository Review

**Recommended model:** GPT-5.6 Sol  
**Reasoning effort:** Max

```text
You are the final architecture, correctness, fairness, and release-readiness reviewer for CAPSULE CHAOS.

MODEL / EFFORT
Use GPT-5.6 Sol with Max reasoning.

You are the implementation agent for CAPSULE CHAOS.

Before modifying anything:
1. Read `CAPSULE_CHAOS_planner.md` in full.
2. Inspect the current repository and the work completed by earlier phases.
3. Confirm that this phase's prerequisites actually exist in the codebase.
4. If the planner materially conflicts with the repository or a prerequisite phase is missing/broken, STOP and clearly report the conflict. Do not invent a replacement architecture.

Global implementation rules:
- Implement the approved planner; do not redesign unrelated systems.
- Stay within THIS phase except for the smallest supporting changes required to make it compile/test.
- Preserve all completed behavior from earlier phases.
- Maintain the mandatory separation:
  1. Game Engine = WHAT happens.
  2. Timeline = IN WHAT ORDER it is presented.
  3. Presentation = HOW it looks/sounds.
- Gameplay outcomes must never be decided inside React components, animations, timers, or audio handlers.
- Do not use `Math.random()` for any gameplay outcome, card choice, target choice, winner choice, or other result-affecting behavior.
- The host must never gain a production control to reroll, force, choose, replace, or override a winner/result.
- Keep game behavior deterministic for the same normalized entries + config + seed.
- Production code must remain compatible with the static/browser-only V1 architecture unless the planner explicitly says otherwise.
- Use TypeScript types instead of loosely shaped objects where practical.
- Add or update tests for every behavior introduced in this phase.
- Run all relevant tests and the production build before finishing.
- Fix failures caused by your changes.
- Do NOT git commit.
- Do NOT git push.
- Do not begin a later phase early just because it appears convenient.

When finished, return a concise implementation report containing:
- What you implemented.
- Important files created/changed.
- Tests/build commands run and their results.
- Acceptance criteria status for this phase.
- Any real blocker or follow-up that should be handled by a later phase.


THIS IS NOT A NEW FEATURE PHASE.
Review the entire completed repository against `CAPSULE_CHAOS_planner.md` and the completed Phases 1–18. Fix defects you discover, but do not redesign the product or add unrelated features.

REVIEW OBJECTIVES

1. DETERMINISTIC FAIRNESS
- Trace the full path:
  secure seed -> canonical lock payload -> SHA-256 commitment -> deterministic PRNG -> game engine -> resolved timeline -> presentation -> official winner -> audit.
- Verify same normalized entries + config + seed reproduces the same:
  - card choices
  - targets
  - eliminations
  - revivals
  - finalists
  - official winner
- Search the repository for `Math.random`, hidden random helpers, Date/time-based winner logic, array shuffles, or UI-level random choices that could affect outcomes.
- Confirm presentation-only randomness cannot alter outcome.
- Confirm actual seed remains hidden until allowed by final audit flow.

2. ARCHITECTURE BOUNDARIES
Verify:
- Engine determines WHAT.
- Timeline determines ordered presentation of already-resolved events.
- Presentation determines HOW it looks/sounds.
- React components/timers/animations/audio do not decide gameplay.
- Card logic is data-driven/registry-based rather than scattered through UI.

3. CARD CORRECTNESS
Review all 16 V1 cards, eligibility, fallback, phase rules, caps, and combinations.
Pay special attention to:
- Mirror
- Chaos Bomb
- Duel
- Steal
- Nullify
- Final Pass expiration
- Ghost Return
- Fate Swap
- System Override
- Jackpot
- protection consumption order
- revival caps
- Legendary caps
- phase convergence

4. PHASE CORRECTNESS
Verify:
- Phase 1 target logic.
- Phase 2 -> 10.
- Phase 3 -> 5.
- Phase 4 rule reversal -> 3.
- Final Fate -> 2.
- Final -> exactly one official winner by default.
- Auto Advance and manual Next Phase produce the same underlying results.

5. FAKE-OUT SAFETY
Confirm:
- fake winner sequences are presentation only.
- `OFFICIAL WINNER` is reserved for final irreversible state.
- `RESULT VERIFIED` requires successful verification.
- skip/reload/pause during fake-out cannot change winner or bypass official result.

6. RECOVERY
Test reload/recovery at representative points:
- Phase 1
- Chaos card reveal
- Phase 3
- Final Five
- Final Fate
- Final Two fake-out
- after official winner
Confirm seed/timeline/winner are unchanged.

7. AUDIT INTEGRITY
Verify exported audit contains:
- schema/version
- locked entries
- config
- seed
- commitment
- rules/PRNG version
- event sequence
- cards
- eliminations/revivals
- phase transitions
- official winner
Tampering with seed/config/entries must fail verification.

8. PRODUCTION SAFETY
Search for and remove/block from production:
- force winner
- reroll
- hidden player selection
- dev-only seed/result manipulation
- debug panels
- test-only shortcuts
- unsafe emergency reset behavior

9. TEST/SIMULATION STRESS
Run all existing tests, lint/typecheck, and production build.
Then perform a deterministic stress simulation covering at least:
- sizes 8, 20, 30, 48, 60, 100
- all cards enabled where eligible
- many seeds
Aim for at least 5,000 complete simulated games if the test suite/runtime makes that practical.
Assert:
- termination
- event cap not exceeded
- valid references
- no negative counts
- phase convergence
- exactly one official winner by default
- deterministic replay

10. PRESENTATION/ASSET FAILURE
Confirm missing image/audio assets cannot change results or crash the game into an alternate outcome.
Verify mute/reduced motion/speed modes do not change outcome sequence.

11. RELEASE READINESS
Compare repository behavior against Section 50 `V1 Definition of Done` item-by-item.
Fix issues that are in approved scope.
Do not add post-V1 remote controller/backend features.

FINAL RESPONSE
Return:
- Executive release-readiness status.
- Defects found and fixed.
- Any unresolved blocker, with exact file/behavior.
- Commands/tests run and results.
- Simulation count/results.
- V1 Definition of Done checklist.
- Explicit confirmation whether any production result-manipulation control remains.
- Do NOT git commit.
- Do NOT git push.
```
