# Act 2 — Escape Run: implementation specification

**Specification:** Breakout 1.0. **Status:** ready for implementation; not implemented by this document.
**Dependencies:** implement the shared contracts in [Act 1](ACT_1_FAULTLINE_BUILD_SPEC.md) first. The output feeds [Act 3](ACT_3_FINAL_CLASH_BUILD_SPEC.md).

Read all three specifications before coding. This file is authoritative for racing, qualifications, race media and race timing. Fixed rules are already committed in Act 1; do not introduce a new host option, pick a different race system, or retain the old individual capsule draw as an intermediate step.

## 1. Purpose and emotional arc

Escape Run creates a situation that develops between reveals. Every remaining capsule occupies a visible position, every movement affects that position, and four exit slots progressively become scarce. The audience can follow a leader, notice a late burst, compare the distance still needed, and understand a loss at the finish. The emotional progression is **fresh opportunity → recognizable leaders → pressure on the cutoff → shared acceleration → qualification**. The question is **“Can my capsule reach an exit before the fourth slot is gone?”** The game remains an automatic raffle; viewers do not submit moves and names do not have simulated personalities or hidden skill ratings.

Unlike Act 1, entrants do not share one group fate. Unlike Act 3, they do not face a single opponent. This act's central information is persistent distance and the number of exits already reserved. No entrant is eliminated during the early race beats. Eliminate all nonqualifiers together only when the race completes.

### Required audiovisual paragraph

Open onto an emergency escape conduit extending horizontally toward four bright docking gates. The background picture shows a damaged reactor behind the starting line and a cooler, cleaner exit at the far side; low-contrast conduit ribs establish direction without cluttering individual lanes. Give each capsule a readable name anchored in a stable lane, a small exhaust trail during movement, and a finish gate that visibly locks when its slot is awarded. Use functional distance ticks, an exit icon, a burst icon for a three-step move, and a photo-finish icon only when an exact cutoff tie occurs. Animation should communicate real progress: simultaneous engine ignition, a shared launch, smooth travel at a speed proportional to the revealed movement value, then a readable pause at the new positions. A restrained 96 BPM pulse, synchronized engine whoosh, short gate-lock tones, and a softened bed as the final slots approach create urgency; use one combined launch sound instead of a noisy sound per entrant. The feeling should be an escape with a narrowing opportunity, where overtakes are visible and the audience can anticipate the next move. Never show a capsule apparently winning a place that the recorded rules did not award.

## 2. Input, output, and arbitrary counts

Receive the actual `survivorIds` from Faultline in original `entryIndex` order. Do not assume 12 survivors, an even number, or a multiple of four.

| Input count M | Required behavior                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 0             | Invalid simulation input; throw before showing any race.                                                                 |
| 1–4           | Emit `act.skipped` and pass all IDs unchanged to Final Clash; no race, fake gates, or empty manual boundary.             |
| 5–16          | Race all entries for exactly four places.                                                                                |
| Above 16      | Throw `faultline-handoff-too-large`; this is an orchestration defect, not a reason to silently truncate or create heats. |

Normal odd cases such as 5, 7, 9, 11, 13 and 15 all race together. No bye, empty opponent, extra qualifier, or separate lottery is needed. There is one race, not several heats with unequal group sizes.

Output `qualifierIds` in official finish order, plus race history. The next act randomly assigns bracket seats; the race winner receives no semifinal advantage. In the skipped case preserve original input order and record that no finish order exists.

## 3. Exact movement and finish rules

### 3.1 Preparation

Use the `race-decks` and `race-photo` derived seeds from Act 1. Construct one fresh `SeededRng` per stream.

1. Sort race IDs by original `entryIndex`. This is the stable lane order for the whole act.
2. In that order, independently call `deckRng.shuffle([1,1,2,2,3,3])` once per entrant. These six values are that entrant's movement deck.
3. Call `photoRng.shuffle(raceIds)` once to create `photoPriorityIds`; lower array index has precedence in an exact crossing-time tie.
4. Initialize every racer at integer distance zero, with no finish record and no qualification slot.
5. Generate the entire race before playback. Do not inspect or redraw a deck because the race looks uneventful.

The common deck inventory is visible in the opening rules: **“Everyone has 1, 1, 2, 2, 3, 3 in a different order. First four to distance 9 escape.”** Do not expose anyone's unplayed deck order, future movement values, or photo priority before they are legitimately revealed. This inventory is equal; no entrant gets a stronger deck.

### 3.2 Shared beats

Use one-based `beatIndex` from 1 through 6. On a beat, every racer who has not already qualified reveals deck value `deck[beatIndex-1]`. Qualified racers are parked and do not take another move. Unused deck values remain in the audit, not on the live stage.

For each moving racer:

```ts
from = currentDistance;
movement = deck[beatIndex - 1];
to = from + movement;
crossesThisBeat = from < 9 && to >= 9;
```

All moves use the same start-of-beat state and resolve together. Do not loop through entrants and update the race winner/slots in that loop. First compute all candidate moves and crossings; then rank the crossings.

### 3.3 Crossing order without floating-point ambiguity

A crossing has `remaining = 9 - from` and `movement`, representing the fraction `remaining / movement` of the shared movement interval needed to reach the line. Compare two crossings `a,b` with integer cross multiplication:

```ts
const difference = a.remaining * b.movement - b.remaining * a.movement;
// Negative: a reached earlier. Positive: b reached earlier.
// Zero: apply the precommitted photoPriorityIds order.
```

All values are small positive integers; no epsilon, rounded animation coordinates, locale sorting, or arrival-order callback is allowed. Earlier beats always outrank later beats. Within a beat, only the exact fraction and, if equal, the photo priority determine order. Movement magnitude alone is not a finish rule.

At the start of the beat let `available = 4 - previousQualifiers.length`. Sort all crossings and select the first `available`, or all crossings if fewer cross. Append them to official finish order. Slot numbers are 1–4, assigned in this order. Earlier qualified racers never lose their places.

After the shared beat:

- Apply all new integer distances. Visual coordinates clamp at the finish line; the audit retains the true `to` value, including overshoot.
- Newly qualified racers get status `qualified` and their official slot number.
- If fewer than four have qualified, all other racers remain `active`; continue the race.
- If four have qualified, mark every remaining race entrant `eliminated` in the same atomic result event and stop. Keep the four qualifiers eligible to win.

Every deck totals 12; therefore everyone could reach distance 9 by beat 6. There will always be four qualifiers by that point when M>=5. Assert this invariant; do not add an emergency draw, seventh beat, or sudden-death rule. A nonqualifier reaching the line on the same closing beat does not earn a fifth place.

### 3.4 Exact ties and the photo-finish reveal

An exact tie is a rule tie, not a fake slow-motion accident. Use the locked photo priority whenever equal crossing fractions occur. Only add a dedicated four-second photo-finish presentation when an equal-fraction group **straddles the last available qualification slot**: at least one member receives a place and at least one does not.

To find that condition, after sorting crossings, compare crossings at indexes `available-1` and `available` if both exist. If their fractions compare equal, collect the entire equal-fraction group as `cutoffTieIds`. `tieSlotsAvailable` is `available - numberOfCrossingsStrictlyEarlierThanThisGroup`. Every other beat has `cutoffTieIds=[]` and no special photo-finish hold. Ties wholly within qualifying places still use the same recorded priority but do not add suspense time.

For a cutoff tie, display every tied entrant, the number of places available, and **“EXACT TIE — LOCKED PHOTO ORDER.”** Do not fabricate a pixel advantage or claim that one arrived first. After two seconds, reveal the priority order for this group only and identify the awarded slots. At the official resolution boundary, update all statuses together. The complete tie-priority permutation becomes available in the final audit.

### 3.5 Worked fixtures — implement these tests exactly

| Previous distance / move                                                 | Crossing fraction  | Correct interpretation                                           |
| ------------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------- |
| A: 8 / +1; B: 7 / +3                                                     | A=1; B=2/3         | B reaches first despite starting behind.                         |
| A: 8 / +2; B: 7 / +3                                                     | A=1/2; B=2/3       | A reaches first.                                                 |
| A: 8 / +1; B: 7 / +2; C: 6 / +3                                          | All equal 1        | Use locked photo order; do not prefer the largest move.          |
| Three slots already filled; A: 8 / +2, B: 8 / +2; photo order B before A | Both 1/2           | B gets slot 4; A is out; show the cutoff photo finish.           |
| Two slots already filled; A: 8 / +3, B: 8 / +2, C: 7 / +3                | 1/3, 1/2, 2/3      | A/B qualify; C is out; no photo finish.                          |
| No earlier qualifiers; five cross with equal fraction                    | Five-way exact tie | First four in photo order qualify; show all five and “4 PLACES.” |

## 4. Mandatory engagement features

### 4.1 Movement reveal and honest burst cues

Reveal every active racer's movement value at the same base-time offset. Values remain visible until the end of the beat. A `+3` move gets a short exhaust extension and burst icon; `+1` and `+2` get smaller trails. This is a visual description of actual distance, not an extra power. No “lucky boost” is added by animation.

Keep each name at the same vertical lane position through the whole act. Horizontal positions change; rows do not repeatedly sort. Viewers should find one lane and follow it. Once qualified, the lane visibly says `ESCAPED · SLOT n`; do not erase it or compress the remaining rows.

### 4.2 Last Exit Chase

When exactly three slots are already filled at the **start** of a beat, show **“ONE EXIT LEFT.”** In the lane area, softly emphasize the two unqualified racers with the greatest current distance; for equal distances choose earlier lane index for this purely visual emphasis. Both keep the same physics and odds. Do not use future move values or eventual winner IDs to select them. If more than two are tied at the same leading distance, emphasize all tied leaders instead.

When two slots remain, say “TWO EXITS LEFT.” When all four fill in the first crossing beat, show the genuine group result; never split it into several fake beats to stage a last-slot chase. No replay, rubber-banding, forced overtake, or targeted catch-up exists.

### 4.3 Global slow movement on the closing beat

If the precomputed beat fills the fourth slot, use an 8,000 ms movement interval instead of 5,000 ms for **every** moving racer. Keep each racer's position equal to `from + movement * p`, where the shared progress `p` runs linearly from 0 to 1. Do not ease each capsule independently, which could visually reverse the real crossing order. Exhaust and camera elements may ease; contestant positions may not.

No label announces that this is the closing beat before the first crossing happens. The longer movement is presentation pacing, not a different outcome rule. No “almost winner” title is displayed.

### 4.4 Result facts and spectator connection

Use captions generated from resolved data only. Allowed captions are “X exits filled,” “Name gains three,” “Name reaches slot n,” and the exact tie message. Do not claim a comeback unless a racer was behind an opponent before this beat and genuinely passes that opponent by the relevant crossing comparison.

At act completion, give the four qualifiers one shared lineup with names, slot numbers, and the statement **“DISTANCE RESETS. THE FINAL FOUR FACE OFF.”** Keep eliminated names available in the paused roster drawer and final audit. Do not revive them. This is a short chance for the host to invite cheering; it never waits for votes or messages.

## 5. Types, engine events, and visibility

Create `src/game/breakout/escapeRun.ts` and extend shared types:

```ts
interface RaceMove {
  playerId: string;
  from: number;
  movement: 1 | 2 | 3;
  to: number;
  crossing: null | { remaining: number; movement: number };
}
interface Qualification {
  playerId: string;
  slot: 1 | 2 | 3 | 4;
  beatIndex: number;
  crossing: { remaining: number; movement: number };
}
interface RaceBeat {
  beatIndex: number;
  moves: readonly RaceMove[]; // canonical lane order, no parked racers
  crossingsInOrder: readonly string[];
  newlyQualified: readonly Qualification[];
  allQualified: readonly Qualification[];
  cutoffTieIds: readonly string[]; // lane order for initial display
  cutoffTiePriorityIds: readonly string[]; // order revealed only in photo panel
  tieSlotsAvailable: number; // 0 when no cutoff tie
  eliminatedIds: readonly string[]; // empty until the closing beat
  raceComplete: boolean;
}
interface RaceViewState {
  laneIds: readonly string[];
  distanceById: Readonly<Record<string, number>>;
  qualifications: readonly Qualification[];
  beatIndex: number;
  complete: boolean;
}
```

Return `{ qualifierIds, movementDecksById, photoPriorityIds, beats }`. The orchestration layer stores the hidden decks/priority as audit data and emits `act.started`, one `race.beat-resolved` per beat, and `act.completed`. Include all movers in event participants and the full before/after snapshots. The closing beat's after snapshot eliminates the nonqualifiers atomically. Previously eliminated Faultline entrants stay eliminated in every snapshot.

Use the `before` snapshot for official status until `resolutionBaseMs`; intermediate position and provisional gate displays come only from the current beat. Before a racer's crossing offset, that racer cannot appear in a gate, as a qualifier, in a finalist badge, or in a future-oriented live-region announcement. Future decks and final qualifiers must not be placed in hidden-but-accessible markup.

A gate may display **“REACHED — RESOLVING”** after a non-tied entrant's actual crossing, using the current beat's ordering. A cutoff-tied gate displays **“PHOTO FINISH”** until its tie ordering is revealed. Use “QUALIFIED” and `qualified` status only at the atomic resolution offset. Prior-beat qualifiers remain labeled qualified throughout.

## 6. Layout, animation, and precise timing

### 6.1 Race stage

Retain the 1920×1080 logical stage and safe regions from file 1. Within the act area, use:

- Name column: x=64–304.
- Track: x=328–1496; distance 0 at 328 and finish 9 at 1496.
- Four gate slots: x=1528–1856.
- Lane region: y=180–884. `rowHeight = min(76, 704 / M)`. Center the used rows vertically within that region.
- Capsule center y is the lane center; x is `328 + min(distance,9)/9 * 1168`.
- Name labels: single line, 28 logical px minimum, ellipsis within the fixed column; full text in the accessible label and paused roster drawer. Duplicate display names also show their original one-based ticket number. Each racer retains its unique key and lane.
- Every track shows subtle common distance marks at 0, 3, 6, 9. Do not add a different dense grid per racer.
- The gate column shows `1`–`4` and “OPEN,” “RESOLVING,” “PHOTO FINISH,” or the qualifier's name. A decorative gate image must not obscure the text.

Keep all 5–16 lanes on screen together. Do not replace them with a scrolling leaderboard. The finish line and gate state remain legible at 1280×720. Use stable shell colors for recognition but pair them with names and ticket numbers; color carries no odds or status advantage.

### 6.2 Act start and handoff

`act.started` lasts 10,000 ms: 0–2500 conduit reveal, 2500–6000 the rule sentence and common movement inventory, 6000–10000 all capsules at the start with **“FOUR EXITS. EVERYONE MOVES TOGETHER.”** Existing distances must be zero at this point.

`act.completed` lasts 7,000 ms: 0–2000 gates finish locking, 2000–7000 four-qualifier lineup and the Final Clash objective. Hold here for manual Next Act when auto-advance is off. The four IDs, not the gate graphics, are the output contract.

### 6.3 Per-beat timeline

Let `M = raceComplete ? 8000 : 5000`, `P = cutoffTieIds.length ? 4000 : 0`, and `E = 2800 + M`.

| Base interval in ms | Visual/copy                                                                                                      | Audio                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 0–2000              | Hold current positions; engines arm; show beat number and currently unoccupied exits. Movement values concealed. | Soft two-pulse engine charge.                                                |
| 2000–2800           | All actual movement values appear simultaneously as +1/+2/+3.                                                    | One short ignition click; no 16-way cue stacking.                            |
| 2800–E              | All capsules move with the same linear shared progress. Gate crossing displays occur at `2800 + fraction*M`.     | One launch whoosh; engine bed.                                               |
| E–E+P               | Only for a cutoff tie: tied names/available slots visible immediately; reveal their locked ordering at E+2000.   | Dry camera tick at E; beds reduce to one quarter gain; no false celebration. |
| E+P                 | Commit the after snapshot, qualifiers, elimination group if complete, and official gate labels.                  | One gate-lock chord for all new qualifiers; no chord if none qualified.      |
| E+P–E+P+4500        | Readable distance/slot result hold. Closing beat says “FOUR ESCAPED.”                                            | Bed continues quietly, then releases on a completed race.                    |
| E+P+4500–E+P+5000   | Brief stable transition into next beat or act-completed event.                                                   | No new transient.                                                            |

`resolutionBaseMs = E + P`; `durationBaseMs = E + P + 5000`. No extra generic reaction duration. Apply the shared Fast/Normal/Cinematic multipliers once, never both in the controller and CSS.

Gate crossings may require several cue times, but cap transient sounds: one gate-lock chord at official resolution is sufficient even when four qualify. Never use an individual elimination sound for each nonqualifier. Live-region announcements occur once at resolution, e.g. “Beat four. Three qualified. One exit remains.”

Reduced motion keeps all lane positions and rules visible, replacing travel with a 200 ms crossfade ending at motion end. Keep movement values visible, and show the crossing-order list in the result area only at official resolution so spatial motion is not required to understand who reached first. The optional photo panel still reveals its tie ordering at its specified midpoint. Keep the official resolution/tie timing unchanged. Mute removes no information.

## 7. Asset manifest and production briefs

Extend the offline media generator and explicit manifest entries from file 1. All required assets live in `public/assets/breakout/`; no remote dependency. Names and distances are UI text, not baked into art. SVG/WAV format and mixing rules are the shared defaults.

| Asset ID / file                                 | Mandatory content and use                                                                                                                                                                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg_escape_run` / `bg_escape_run.svg`           | Side-on escape conduit, darker damaged starting side and luminous cool exit side. Navy `#081725`, muted teal `#224E5B`, restrained warm gate lights `#F1C76C`. Keep x=64–1496 visually quiet for all lanes. No words, racers, prefilled gates, or track results. |
| `img_exit_gate` / `img_exit_gate.svg`           | Transparent gate frame with separate open/closed groups addressable through UI state; use once per slot. The closed state is mechanically sealed, not a lethal trap.                                                                                             |
| `fx_capsule_exhaust` / `fx_capsule_exhaust.svg` | Short directional trail behind a capsule, never ahead of its true position. Scale visual trail length by +1/+2/+3 without moving the capsule center.                                                                                                             |
| `icon_exit` / `icon_exit.svg`                   | Simple doorway plus forward arrow; paired with exit count text.                                                                                                                                                                                                  |
| `icon_burst` / `icon_burst.svg`                 | Three short exhaust streaks; used only for actual +3 moves.                                                                                                                                                                                                      |
| `icon_photo_finish` / `icon_photo_finish.svg`   | Finish-line camera silhouette; used only for an exact cutoff tie.                                                                                                                                                                                                |
| `sfx_race_charge` / `sfx_race_charge.wav`       | 1.5 s soft rising electric engine charge.                                                                                                                                                                                                                        |
| `sfx_race_launch` / `sfx_race_launch.wav`       | 0.8 s shared whoosh with a short ignition transient.                                                                                                                                                                                                             |
| `sfx_exit_lock` / `sfx_exit_lock.wav`           | 0.9 s positive mechanical lock chord; distinct from the final winner music.                                                                                                                                                                                      |
| `sfx_photo_finish` / `sfx_photo_finish.wav`     | 0.25 s dry camera/relay tick; no sports crowd sample.                                                                                                                                                                                                            |
| `amb_escape_run` / `amb_escape_run.wav`         | 10 s seamless low air-flow/engine loop.                                                                                                                                                                                                                          |
| `music_escape_run` / `music_escape_run.wav`     | 10 s loop at 96 BPM, four bars, restrained forward-driving pulse. Do not sync gameplay by listening to the file.                                                                                                                                                 |

Fallbacks: CSS horizontal lanes, circles or existing capsule shells, a text finish line at 9, four labeled rectangles for slots, and plain +movement values. Missing exhaust means no trail; missing photo icon retains “EXACT TIE.” Art and sound must never determine qualification.

For the closing beat, lower the music bed to half its configured gain after the first actual crossing. Do not increase loudness to communicate tension. During photo finish use the lower quarter gain specified in the timing table. These are event-local gain overrides; restore the base mix on the next event, do not multiply previous overrides repeatedly.

## 8. Step-by-step build instructions

1. **Create `escapeRun.ts` and its typed records.** Implement input count handling, stable lanes and the two independent random streams. Add preparation tests before the renderer.
2. **Implement the shared-beat simulator.** Compute all moves from one before-state, rank crossings with integer comparison, append no more than four qualifiers and stop by beat six. Return hidden preparation data for auditing.
3. **Implement cutoff tie detection.** Use the boundary-group algorithm in section 3.4. Add all worked fixtures, including five simultaneous tied racers. Do not infer ties from DOM positions.
4. **Add `race.beat-resolved` to the event union and timeline builder.** Store before/after states and explicit qualification/cutoff metadata. Set resolution and duration from section 6.3.
5. **Integrate handoff routing.** Accept actual Act 1 outputs, skip for 1–4, assert 5–16 for a played race, and pass exactly four finish-ordered IDs to Act 3. Do not select bracket opponents here.
6. **Create `src/presentation/breakout/EscapeRunStage.tsx` and `.module.css`.** Implement the stable lane layout, shared-progress position function, common finish ticks, movement values and gate states. Remove any old machine widget from the primary stage for this act.
7. **Implement Last Exit Chase and the photo panel.** Derive emphasis from current positions only. Keep every tied name visible in a cutoff panel; for up to 16 tied entrants use a 4-column name grid at 28 logical px, with slot count and order labels. No row gets hidden behind the gates.
8. **Generate and register the required assets.** Extend `scripts/build-breakout-media.mjs`, regenerate the media pack and validate missing-file fallbacks. Use existing capsule SVGs instead of introducing inconsistent characters.
9. **Wire sound to the shared cue scheduler.** Add one launch cue per beat, one combined qualification chord, the optional tie cue and the ambient/music buses. Verify silence during Pause and no replayed old cue after refresh.
10. **Implement accessibility and result lookup.** Single live announcement per beat, full names available in the paused roster drawer, meaningful mute/reduced-motion layouts, no hover-only essential information.
11. **Update audit export and replay.** Record every movement deck, shared beat, crossing fraction, photo priority, qualifier, and final nonqualifier group. Recompute the same complete record when verifying the audit.
12. **Run acceptance checks, then proceed to Act 3.** Do not pad a short race with bonus beats or allow a host “rerun” control on the locked session.

## 9. Acceptance checks

### Pure rules

- For M=1–4, no deck/priority shuffle or race beat occurs; output IDs match input. For M=0 or M>16 use the documented error.
- For each M=5–16 across 1,000 fixed seeds, there are exactly four unique qualifiers, at most six beats, and every nonqualifier is eliminated exactly once on the closing beat.
- Every deck is a permutation of `[1,1,2,2,3,3]`; no per-name deck weights exist. Each deck is generated once and never rerolled.
- Every move starts at the previous resolved distance, uses the correct indexed card, and adds the stated integer value. Parked qualifiers do not move again.
- Validate the six worked crossing fixtures and all positive crossing pairs possible from distances 6–8 and moves 1–3. Comparator ordering is transitive and tie priority never depends on input sort as a tiebreaker.
- Earlier-beat qualifiers cannot be displaced by a faster later-beat move. Never create a fifth gate slot.
- Exact ties entirely within awarded places do not trigger a cutoff panel. A group straddling the last place always does.
- Display-name changes and animation settings leave all ID outcomes unchanged. Skip/pause never call simulation or consume RNG.

### Presentation and recovery

- Freeze screenshots at movement start, each crossing, motion end, photo midpoint and official resolution. Names reach the finish in the same fractional order as the engine.
- Before a crossing, no gate or accessible label contains that future qualifier. Before photo ordering is revealed, no tied entrant has an official awarded slot in the stage.
- Verify an all-four-on-one-beat race, a race with qualifiers on multiple beats, a late burst from behind, and an exact cutoff tie. Do not select only exciting seeds for the test suite.
- A race with no +3 for a particular contestant yet does not incorrectly add a boost icon or sound. Current distance/exit count always agree with the current event offset.
- Pause/refresh/skip during travel and during a tie reveal preserves finish order and all remaining eligibility. Crossing cues do not repeat after recovery.
- Test every M=5–16 at 1280×720 and 1920×1080, plus long/Unicode/duplicate names. All lanes and four slots remain visible without scrolling.
- With reduced motion, the crossing-order result conveys the same qualification information. With muted or unavailable sound, the result is still clear.
- Final handoff contains the four qualifiers and no race advantage or obsolete protection charge.

## 10. Definition of done and handoff

The audience can track every contestant across several meaningful shared beats, understand the exact four qualifiers, and distinguish an actual exact tie from ordinary crossing order. The game has no individual draw sequence anywhere in the race. The result and entire path replay from the locked seed. Proceed to [Act 3 — Final Clash](ACT_3_FINAL_CLASH_BUILD_SPEC.md) with four IDs, or with the original 1–4 IDs when the race was skipped.
