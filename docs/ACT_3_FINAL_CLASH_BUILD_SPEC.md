# Act 3 — Final Clash: implementation specification

**Specification:** Breakout 1.0. **Status:** ready for implementation; not implemented by this document.
**Dependencies:** shared foundation in [Act 1](ACT_1_FAULTLINE_BUILD_SPEC.md); qualification and handoff in [Act 2](ACT_2_ESCAPE_RUN_BUILD_SPEC.md).

Read all three files before coding. Implement this specification exactly, including the small-field routes, simultaneous semifinals, first-to-three championship, truthful result reveal and final release gate. This file deliberately changes the early concept's first-to-two final to **first to three**. No unresolved design choice is delegated to the implementer.

## 1. Purpose and emotional arc

Final Clash turns the last entrants into recognizable opponents with a visible score. Each exchange has an understandable cause: two automatically dealt moves meet, the printed relationship decides the point, and the score carries forward. The emotional progression is **recognition → rivalry → accumulating stakes → match point → decisive release**. The viewer's question is **“Can my finalist win the next exchange?”** One reveal never erases an entire match's accumulated state. A player can recover from a deficit, but the engine never forces that comeback.

The semifinals give two small contests to follow at once; the championship narrows attention to one. The final must finish at its winning point. No capsule draw afterward, provisional winner celebration, revival, recalculation, or reversal is permitted. These are seeded chance moves, not choices submitted by real entrants. Narration must not invent human strategy.

### Required audiovisual paragraph

Bring the finalists into a quiet reactor core that resembles a small championship arena rather than the earlier machine floor or racecourse. The background picture shows two opposing capsule pedestals, a circular energy aperture, and restrained overhead spotlights; most of the picture remains dark so names, moves and score pips dominate. During semifinals, use two equal matchup panels with a shared countdown. During the final, merge the stage into one wide duel and enlarge both contestants symmetrically. Rock uses an angular stone icon, Scissors uses crossed blades with circular handles, and Paper uses a folded sheet; each move has a different silhouette as well as a color. Animation centers on sealed move plates, a simultaneous flip, a short readable interaction between the two symbols, and one point traveling into the winning score. Sound becomes sparse: low reactor rhythm, matched charging tones, a short silence before reveal, a distinct interaction cue, and a clear point click. At match point the aperture narrows and the bed softens; at 2–2 the whole scene holds its breath for one final exchange. Release into warm light and a single fanfare only when the third point is earned. The feeling is intimate, anxious and conclusive, with every dramatic beat attached to an actual score condition.

## 2. Input counts, brackets and fairness

Accept one to four unique eligible IDs from the previous act. Above four or zero is an orchestration error: throw `invalid-clash-field` before playback. Do not silently run another lottery to repair it.

Sort entrants by original `entryIndex` before bracket randomization, regardless of race finish order. For 2–4 entrants, use the `bracket` stream and call `shuffle(canonicalIds)` exactly once. For one entrant, do not consume bracket or match RNG.

| Field | Exact bracket                                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4     | SF1 = shuffled seats 0 vs 1; SF2 = seats 2 vs 3. Both first to 2. Winners meet in a first-to-3 final; SF1 winner is final left seat, SF2 winner right.                       |
| 3     | Seat 0 receives the announced bye to the final. Seats 1 vs 2 play one first-to-2 play-in. Final left seat is the bye entrant; final right is the play-in winner; first to 3. |
| 2     | Shuffled seat 0 vs seat 1 directly in a first-to-3 final. No empty semifinal panels or bye animations.                                                                       |
| 1     | Declare that entrant after the shared lock opening. Display “ONLY ENTRY — OFFICIAL WINNER.” No simulated opponent, move, score, or suspense countdown.                       |

The three-entry bye is a seeded structural advantage after assignment, so make it explicit on screen and in the audit. Each original entrant has the same chance of receiving it. Before assignment, each entrant's winner probability is `1/3 × 1/2 + 2/3 × 1/2 × 1/2 = 1/3`, under uniform move deals. Do not claim the three entrants have identical paths after the bye is known. There is no host-selected bye.

For four entries, semifinal results have no scoring or power carryover into the final. A 2–0 semifinal winner and a 2–1 semifinal winner both start the championship at zero. For every field size, race placement, floor sector, display name and prior spotlight time provide no advantage.

## 3. Exact move and scoring rules

### 3.1 Moves

Use this fixed internal move order for every shuffle:

```ts
type ClashMove = 'pulse' | 'hack' | 'barrier';
const CLASH_MOVES = ['pulse', 'hack', 'barrier'] as const;
const BEATS = {
  pulse: 'hack',
  hack: 'barrier',
  barrier: 'pulse',
} as const;
```

The legacy internal keys map to the visible moves as `pulse → Rock`, `hack → Scissors`, and `barrier → Paper`; keeping those keys preserves deterministic replay compatibility. Visible labels are Rock, Scissors, Paper. Show the relationship strip throughout the act: **“Rock beats Scissors · Scissors beat Paper · Paper beats Rock.”** This rule is all the audience needs to understand a point. There are no damage numbers, critical hits, elemental bonuses, extra cards, health bars, or tie rounds.

### 3.2 Deal and resolve one exchange

1. Use that match's dedicated RNG stream.
2. Call `rng.shuffle(CLASH_MOVES)` once.
3. Deal index 0 to the left contestant, index 1 to the right; the third move is unused for that exchange.
4. If `BEATS[leftMove] === rightMove`, award the left contestant one point; otherwise award the right contestant one point.
5. Reveal both dealt moves together. One distinct move per seat guarantees one point and no tied exchange.
6. Stop the match immediately when either contestant reaches the target. Never generate an unused extra exchange.

All six ordered deals are equally likely under a uniform shuffle. Each seat wins three of the six. Both participants always receive distinct moves; explain this in the opening rule sentence rather than making viewers wonder why ties never occur.

| Left / right     | Point winner | Visual explanation     |
| ---------------- | ------------ | ---------------------- |
| Rock / Scissors  | Left         | Rock crushes Scissors. |
| Scissors / Rock  | Right        | Rock crushes Scissors. |
| Scissors / Paper | Left         | Scissors cut Paper.    |
| Paper / Scissors | Right        | Scissors cut Paper.    |
| Paper / Rock     | Left         | Paper covers Rock.     |
| Rock / Paper     | Right        | Paper covers Rock.     |

The relationship decides the point. Do not first choose the winner and then fabricate moves to justify it.

### 3.3 Match lengths and independent streams

Use `clash-sf1`, `clash-sf2`, `clash-playin`, and `clash-final` exactly as derived in file 1. Construct only the RNG instances needed by the route. Stream derivation itself may have prepared every seed; unused match streams must consume no numbers.

- A semifinal/play-in is first to 2 and takes 2–3 exchanges.
- The championship is first to 3 and takes 3–5 exchanges.
- A match cannot tie or loop indefinitely.
- Each side begins at zero in each new match.

Simulate both four-player semifinals independently, then combine their exchange records by exchange index for presentation. Shared round 1 contains both first exchanges; round 2 contains both second exchanges; round 3 contains only an unfinished semifinal's third exchange or both third exchanges when both went 1–1. A completed match's panel remains visible with its winner; it receives no new deal or extra point.

Maximum matchup exchanges are 11 for four entrants: 3+3+5. Maximum shared reveal beats are eight: three parallel semifinal beats plus five final beats. Three entrants also need at most eight beats; two need at most five. This is a strict upper bound, not a target to pad toward.

## 4. Mandatory suspense features and exact triggers

### 4.1 Sealed-move reveal

Every exchange begins with visually identical sealed plates. Their colors, audio, glow, accessible names and idle movement must not reveal the hidden move or eventual point winner. Both names and current scores remain visible. The charge sequence is symmetric, and both plates flip at one timeline offset.

Use **“MOVES LOCKED”**, not “PLAYERS CHOOSING.” These are automated chance moves. The brief hold gives spectators time to make their own predictions without requiring any input channel. No voting button, chat API, timing challenge or pause for audience responses is part of this build.

### 4.2 Match-point tension

In a semifinal/play-in, a contestant with one point is one point from advancing. Show `ADVANCEMENT POINT` under that contestant. Do not add extra seconds to semifinals.

In the final, when either contestant already has two points before an exchange, show `CHAMPIONSHIP POINT` under that contestant. Add exactly 2,000 ms to the sealed hold for that exchange. If both have two points, replace this extra time with 4,000 ms total, label **“LAST SPARK — NEXT POINT WINS”**, and illuminate the central aperture as one narrow line. Do not add 2,000+4,000; the 2–2 rule is the complete override.

The engine may legitimately produce 3–0, 3–1 or 3–2. Do not resample a deal or insert a comeback because the final is short. A clean sweep gets the same official recognition and celebration.

### 4.3 Score tells the story

Use two filled/unfilled pips per semifinal contestant and three per final contestant, plus a numeric score. On a point, one small energy token travels from the interaction area to the earned pip. The pip and numeric score update together at the resolution offset. Do not fill the pip during the travel or display a future score in the accessibility tree.

At a final score of 2–0, permitted copy is **“ONE POINT FROM THE TITLE.”** If the trailing contestant then scores, use **“STILL ALIVE — 2–1.”** If it becomes 2–2, use the actual Last Spark trigger. No copy predicts that the trailing contestant will recover. Keep all other captions factual: move relationship, point winner, score, match winner.

### 4.4 One official winner

The point that reaches three, the winner state, the winner label and the winner fanfare all occur at the same official resolution offset. The decisive championship exchange is carried by the single `winner.declared` engine event; it is not followed by a second winner-selection event.

After that offset, hold the complete final score, both names, and a clear winner treatment. Transition to the persistent winner/audit view during the celebration. There is no “pending verification” fake-out. Actual verification failures before playback block replay; they are not entertainment.

## 5. Types and event sequencing

Create `src/game/breakout/finalClash.ts`. Define:

```ts
type MatchId = 'sf1' | 'sf2' | 'playin' | 'final';
interface ClashExchange {
  matchId: MatchId;
  exchangeIndex: number; // one-based within this match
  playerIds: readonly [string, string]; // left, right
  moves: readonly [ClashMove, ClashMove];
  scoreBefore: readonly [number, number];
  scoreAfter: readonly [number, number];
  pointWinnerId: string;
  pointsToWin: 2 | 3;
  matchWinnerId: string | null;
  matchLoserId: string | null;
}
interface ClashMatch {
  matchId: MatchId;
  playerIds: readonly [string, string];
  pointsToWin: 2 | 3;
  exchanges: readonly ClashExchange[];
  winnerId: string;
  loserId: string;
}
interface ClashBracket {
  route: 'four' | 'three' | 'two' | 'one';
  seededSeatIds: readonly string[];
  byePlayerId: string | null;
  semifinalMatches: readonly ClashMatch[];
  finalMatch: ClashMatch | null;
  winnerId: string;
}
```

`simulateFinalClash(inputIds, streams)` returns the bracket and all exchanges. No DOM, timing, asset, or host dependency enters this function.

Add these typed engine events:

| Event                     | Payload and snapshot behavior                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `clash.bracket-ready`     | Route, seeded seats, bye ID, current matchup player IDs and targets. No future moves, match winners or final opponents in the stage-facing bracket view.     |
| `clash.exchange-resolved` | One exchange for play-in/final, or up to two for parallel semifinals. Apply all points and any newly completed semifinal eliminations in one after snapshot. |
| `clash.final-ready`       | Two finalist IDs and reset scores `[0,0]`; no winner. Used only after semifinals/play-in.                                                                    |
| `winner.declared`         | `winnerId`, `reason`, and `decisiveExchange: ClashExchange                                                                                                   | null`. For final-score, contains the winning exchange and simultaneously marks the loser eliminated and winner `winner`. For sole-entry, exchange is null. |

Act 3 start converts incoming qualified finalists to active while preserving eligibility. A semifinal winner becomes qualified while waiting; its loser becomes eliminated. A finalist-ready event converts both finalists to active, preserving their earlier match history. The final decisive event ends with exactly one `winner` and all other original entrants eliminated.

Do not separately emit the decisive exchange as `clash.exchange-resolved`; otherwise scoring would be applied twice. The audit's exchange iterator must collect both normal exchange payloads and the decisive exchange inside `winner.declared`. Act 3 completion is represented by that terminal event; emit no trailing `act.completed` event or manual boundary after the winner.

### Routes and timeline emission

```text
Four: act.started → bracket-ready → 2–3 parallel semifinal beats
      → final-ready → 2–4 nondecisive final beats → winner.declared

Three: act.started → bracket-ready (announced bye) → 2–3 play-in beats
       → final-ready → 2–4 nondecisive final beats → winner.declared

Two: act.started → bracket-ready (final at 0–0)
     → 2–4 nondecisive final beats → winner.declared

One: act.started (audit only, no duration) → winner.declared (sole entry)
```

The shared show-lock event and Acts 1/2 skipped events occur before these routes. Bracket views show unknown future opponents as **“Winner of Semifinal 1”**, etc., until those results have actually resolved. Do not construct the live bracket from the private completed match objects without filtering future fields.

## 6. Stage, choreography, and precise timing

### 6.1 Layout and readability

Use the same 1920×1080 stage and safe regions as the other acts. During parallel semifinals, use two equal panels: x=64–936 and x=984–1856, y=180–820. Each panel contains two contestants, their capsule portraits, move plates, two-point score and one relationship caption. Names are at least 36 logical px, scores 44. No panel may cover the other or zoom over an unfinished match.

In the final, use left contestant area x=144–704, right x=1216–1776, and the interaction area x=744–1176. Names are 48 logical px minimum, numeric scores 64, move labels 36. Two lines are permitted for names; longer names have a visible shortened label plus the full accessible name and paused roster drawer. Use the original ticket number to disambiguate allowed duplicate names.

The relationship strip occupies y=850–916. Host controls and captions remain below. Score pips must be distinguishable filled/unfilled without color. The bye recipient stays visibly labeled **“SEEDED BYE — AWAITS FINAL”** during a three-person play-in.

### 6.2 Entrance events

- `act.started`: 2,000 ms title/door transition for 2–4 entrants; no eligibility change except the qualified-to-active reset. For a sole entrant, keep it audit-only and emit no presentation interval.
- `clash.bracket-ready`: 8,000 ms. At 0, display the current route and all names. At 2500, display move relationships and “Two distinct moves are dealt automatically each exchange.” At 5000, highlight first-to-2 semifinal/play-in or first-to-3 direct final rules. The three-entry bye is visible throughout.
- `clash.final-ready`: 8,000 ms. At 0, show actual semifinal/play-in winners and reset score to zero. At 3000, merge panels into the symmetric final layout. At 6000, show “FIRST TO THREE — EVERY POINT COUNTS.” No repeated seed lock or extra winner draw.

All entrance durations use the shared speed multiplier once. Their state changes occur at base offset zero. Do not play entrance sequences for skipped semifinal rounds.

### 6.3 Semifinal/play-in exchange — 12,000 ms

| Interval   | Required animation/copy                                                     | Sound                                                      |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0–2000     | Current score, visible opponents, identical sealed plates; “MOVES LOCKED.”  | Quiet reactor bed.                                         |
| 2000–4000  | Symmetric energy charge; move art remains concealed.                        | One shared charge cue.                                     |
| 4000–4800  | Central “REVEAL” indicator; reduce music to quarter gain in last 500 ms.    | No transient in last 500 ms.                               |
| 4800–5400  | Both move plates flip together in each active match.                        | One shared plate-flip cue, not four overlapping flips.     |
| 5400–7000  | Play the true Rock/Scissors/Paper interaction; reveal relationship caption. | At most one interaction cue per active match.              |
| 7000–7600  | Winning point token travels to score pip.                                   | Soft score-approach tone included in the point sound.      |
| 7600       | Atomic score/status commit across both matches.                             | Point click; if match ends, a restrained advancement tone. |
| 7600–12000 | Hold scores and actual match winners; completed panel stays still.          | Bed resumes at base gain.                                  |

`resolutionBaseMs = 7600`. A settled match does not charge or flip during another semifinal's third exchange. If both semifinals finish together, both eliminations occur at the same offset. If only one finishes, the field count correctly drops by one and the other match continues.

### 6.4 Championship exchange

From the before score compute:

```ts
extraHoldMs = bothScoresAre2 ? 4000 : eitherScoreIs2 ? 2000 : 0;
R = 9000 + extraHoldMs;
```

| Interval                              | Required animation/copy                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| 0–2400                                | Current score and actual championship-point labels.                                    |
| 2400–`4800+extraHoldMs`               | Identical sealed moves, symmetric slow energy charge; if 2–2 show Last Spark aperture. |
| `4800+extraHoldMs`–`5600+extraHoldMs` | Reveal indicator; beds at 10% configured gain during last 500 ms.                      |
| `5600+extraHoldMs`–`6400+extraHoldMs` | Both plates flip simultaneously.                                                       |
| `6400+extraHoldMs`–`8400+extraHoldMs` | The actual move interaction, with its relationship caption.                            |
| `8400+extraHoldMs`–R                  | Point token travels; old score still displayed.                                        |
| R                                     | Point/score commit. If target reached, winner and loser statuses commit here too.      |

For a nondecisive final exchange, `durationBaseMs = R + 5000`, holding the updated score for five seconds. For `winner.declared` with a decisive exchange, `durationBaseMs = R + 10000`; show the official winner immediately at R, celebrate for ten seconds, then keep the winner screen indefinitely. Do not play a second entrance or winner-selection event.

At R on a win, emit the winner fanfare once and stop tension beds. At R+1000, lift the winner's capsule 28 logical px. At R+1800, begin a single 2,500 ms confetti burst with at most 48 particles, avoiding names and the final score. At R+5000, expose the seed reveal, audit verification and JSON export controls. Keep the runner-up's name and final score in a secondary line. At event completion keep all result controls available; do not auto-start another run.

For sole-entry `winner.declared`, `resolutionBaseMs = 0` and `durationBaseMs = 8000`. Use the official winner presentation, but say “ONLY ENTRY” and omit score, opponent, charge, flip, Last Spark and confetti buildup. Play the fanfare once at the start when sound is enabled and unmuted.

### 6.5 The three interaction animations

- **Rock defeats Scissors:** the rock moves through a short impact arc and the scissors recoil; leave both labels visible; route the point token back to the Rock owner.
- **Scissors defeat Paper:** the crossed blades close once through the edge of the paper; the sheet separates along one restrained cut; route the point to the Scissors owner.
- **Paper defeats Rock:** the sheet wraps around the rock silhouette and settles; route the point to the Paper owner. Do not make the Rock user look like the scorer simply because their icon moved first.

Mirror these animations for left/right seats without changing who wins. Use matched timing and effect scale across moves; no move has a hidden presentation advantage. Decorative shake is capped at 4 logical px and applied to the central effect only, never names or the score.

Reduced motion replaces flips, particles, traveling points, shaking and capsule lifting with 150–200 ms opacity/state transitions at the same reveal/resolution offsets. Show the winning relationship in text. Preserve the suspense hold durations, immediate official winner boundary and all accessibility announcements. No flashing screen or intentionally startling peak is permitted.

## 7. Required pictures, icons, effects and sound

Extend `scripts/build-breakout-media.mjs` and the explicit asset manifest from Act 1. Use locally generated SVG and original synthesized WAV; no asset search or paid download is a prerequisite to coding. All files are under `public/assets/breakout/` with the shared formats/fallback rules.

| Asset ID / file                                           | Exact brief and use                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg_final_clash` / `bg_final_clash.svg`                   | Dark reactor-core arena, centered aperture and symmetric opposing pedestal outlines. Base `#0B0C19`, slate `#282A45`, cool rim light `#8B9BDF`, warm victory accent `#EDC46B`. Empty name/score regions. No prepainted winner, words or crowd faces. |
| `img_clash_plate` / `img_clash_plate.svg`                 | Identical sealed metallic move plate; no motif that discloses the concealed move.                                                                                                                                                                    |
| `icon_rock` / `icon_rock.svg`                             | Angular faceted rock, amber `#F2BE65`; visible Rock label supplied by UI.                                                                                                                                                                            |
| `icon_scissors` / `icon_scissors.svg`                     | Crossed blades with two circular handles, cyan `#65DDE1`; visible Scissors label supplied by UI.                                                                                                                                                     |
| `icon_paper` / `icon_paper.svg`                           | Folded sheet with three horizontal lines, violet `#AE9BE8`; visible Paper label supplied by UI.                                                                                                                                                      |
| `icon_championship_point` / `icon_championship_point.svg` | Single outlined crown-point spark; pair with explicit championship-point text.                                                                                                                                                                       |
| `fx_clash_aperture` / `fx_clash_aperture.svg`             | Transparent radial aperture segments; intensity controlled by current score, not future outcome.                                                                                                                                                     |
| `fx_clash_victory` / `fx_clash_victory.svg`               | Restrained warm rays behind the winning capsule only after resolution. Existing confetti may be reused if its colors match.                                                                                                                          |
| `sfx_clash_charge` / `sfx_clash_charge.wav`               | 2 s symmetric low energy charge; same for all moves and both seats.                                                                                                                                                                                  |
| `sfx_clash_flip` / `sfx_clash_flip.wav`                   | 0.35 s paired metallic plate flip.                                                                                                                                                                                                                   |
| `sfx_pulse_overload` / `sfx_pulse_overload.wav`           | 1.2 s soft electrical ring followed by a short circuit breakup.                                                                                                                                                                                      |
| `sfx_hack_unlock` / `sfx_hack_unlock.wav`                 | 1.2 s three rising lock clicks; no spoken words.                                                                                                                                                                                                     |
| `sfx_barrier_reflect` / `sfx_barrier_reflect.wav`         | 1.2 s rounded impact and a short resonant return.                                                                                                                                                                                                    |
| `sfx_clash_point` / `sfx_clash_point.wav`                 | 0.7 s approach swell, precise point click at 600 ms, then a 100 ms tail; start 600 ms before score commit.                                                                                                                                           |
| `sfx_clash_advance` / `sfx_clash_advance.wav`             | 1 s restrained semifinal advancement tone.                                                                                                                                                                                                           |
| `sfx_breakout_winner` / `sfx_breakout_winner.wav`         | 6 s original warm three-chord release; one fanfare per run, no crowd recording.                                                                                                                                                                      |
| `amb_final_clash` / `amb_final_clash.wav`                 | 8 s seamless low reactor hum with no transient jumps.                                                                                                                                                                                                |
| `music_clash_semifinal` / `music_clash_semifinal.wav`     | 9.6 s loop, four bars at 100 BPM; sparse pulse.                                                                                                                                                                                                      |
| `music_clash_final` / `music_clash_final.wav`             | 12 s loop, four bars at 80 BPM; spacious low pulse, no accelerating fake-out.                                                                                                                                                                        |

The shared two-transient voice limit applies. In parallel matches, emit one interaction cue per match at interaction start, then let them finish before the point/advance cue. Combine simultaneous ordinary point cues into one. For a match-ending semifinal exchange, omit its ordinary point sound entirely and schedule the advancement cue at score commit; combine two simultaneous advancements into one cue. If one semifinal ends while the other only scores, the one ordinary point cue and one advancement cue may overlap within the two-voice limit. On a championship-winning exchange omit the ordinary point cue and play only the fanfare at score commit. Suppressed effects never suppress score text.

Fallback background is a CSS navy radial gradient; move icons fall back to labeled geometric shapes; score uses plain numeric text and circles; victory uses a warm frame and the word WINNER. Missing media cannot hold the match or trigger an alternate outcome.

## 8. Step-by-step build instructions

1. **Create `finalClash.ts` and its types.** Implement the six-case move resolver as a pure function, then the first-to-target match simulator, then the bracket router. Do not start with animations.
2. **Implement all four input-count routes.** Uniformly shuffle bracket seats once; record the three-entry bye; use the dedicated match streams; create no unused opponent or match. Add direct tests for 1, 2, 3 and 4 entrants.
3. **Implement parallel semifinal batching.** Combine corresponding exchanges without replaying a finished match. Preserve separate match histories and correct eligibility after each shared event.
4. **Implement final score reset and terminal winner event.** The decisive exchange belongs only to `winner.declared`. Set exactly one winner at its resolution; do not emit a duplicate score/winner event afterward.
5. **Extend the timeline builder.** Add route-specific entrance events, shared semifinal timing, score-triggered championship holds, the decisive-exchange celebration and the sole-entry path. All timing formulas are in section 6.
6. **Create `src/presentation/breakout/FinalClashStage.tsx` and `.module.css`.** Add stable names, capsule portraits, sealed plates, numeric/pip scores, move relationship strip, bye display and simultaneous reveal. Hide future result fields from the rendered view model.
7. **Implement the three interaction animations.** Mirror by seat and route the point to the correct owner. Check Paper-winning cases specifically. Drive every stage from the shared elapsed clock.
8. **Implement championship-point and Last Spark states.** Derive them solely from the before score. They alter framing/hold duration, never a move deal or point rule.
9. **Generate and register Act 3 assets.** Add the required SVGs/WAVs and their fallbacks to the shared generator, manifest and cue scheduler. Preload the mandatory final art while the earlier acts play, without revealing outcomes.
10. **Connect the official winner UI.** Reuse the existing `WinnerScreen` only after adapting it to the decisive-exchange event. Display winner name/ticket, final score or sole-entry reason, locked commitment, revealed seed, Verify and Download audit JSON. No reroll button.
11. **Finish audit/recovery integration.** Verification must recompute the lock, derived streams, all act results, exact event history and timeline, including photo priority and decisive exchange. A matching winner alone is insufficient. Preserve the old-session behavior from file 1.
12. **Complete the cross-act release gate below.** Only after it passes, route new production sessions through `simulateBreakout`, remove the old phase names from the live V4 stage, and update README/setup copy to describe three acts and variable roster counts.

## 9. Act-specific acceptance checks

### Engine

- Enumerate all six ordered distinct move pairs: exactly one point winner, three wins per seat, no ties, correct relationship text.
- Match scores increase by exactly one total per exchange. No target overshoot; no extra deal after completion; semifinal lengths 2–3 and final lengths 3–5.
- Four entrants yield two real semifinals and one final; three yield a visibly recorded seeded bye, one play-in and one final; two yield only the final; one yields no matchup.
- In a 2–0 semifinal alongside a 1–1 semifinal, shared exchange 3 contains only the unfinished match and never advances the completed score.
- Final scores reset to zero; semifinal margin and race placement cannot affect final move distributions.
- Exactly one terminal `winner.declared` event contains the decisive final exchange, or has null exchange for a sole entrant. Every other original entry ends eliminated.
- Test 3–0, 3–1, 3–2, a comeback from 0–2, and each possible final winning move on both sides using fixed fixtures. Do not force these outcomes in production.
- The same complete input reproduces bracket seats, every dealt move, all scores and the winner. Cosmetic timing changes do not alter any engine record.

### Presentation

- Both plates reveal on the same frame; no glow, sound, hidden accessible text or bracket label leaks a future move/winner.
- Point pip, numeric score, participant status and result caption commit at the same resolution offset.
- Semifinal panels remain equally visible. A completed panel holds its winner without drawing another move while the other semifinal continues.
- 2–0/2–1 championship states add 2,000 ms; 2–2 adds 4,000 ms total; normal states add none. No special hold appears before the score condition exists.
- At the winning point, the official winner label and fanfare occur once. No subsequent event changes the winner or revives the runner-up.
- Verify Pause, Skip and refresh during sealed hold, flip, interaction, point travel and celebration. Recovery preserves scores and suppresses already-passed transient audio.
- Check 1280×720 and 1920×1080, long/Unicode/duplicate names, both left/right winners, mute, missing all new assets and reduced motion.
- Final UI remains useful indefinitely with audit/seed controls and no accidental automatic reset.

## 10. Cross-act release gate — required before enabling V4

### 10.1 Files and integration

All three real act simulators, typed snapshots, grouped events, renderers, cue sheets and mandatory assets are present. The shared engine never imports React, audio, DOM, animation or wall-clock APIs. Presentation never calls RNG or modifies the simulation. Remove the old central dispensing machine, old phase/card explanation screens and fake winner sequence from the V4 route; their source assets may remain for historical material.

Update `src/game/state/gameSession.ts`, `src/app/AppStateProvider.tsx`, setup/game pages, audit exports and verification, persistence and playback to the new contracts. Do not continue importing old `GamePhase` or old per-player elimination timelines into the new route. Do not silently cast incompatible types to make the build pass.

Add these test files, with focused fixtures/helpers as needed:

```text
src/tests/engine/breakoutFaultline.test.ts
src/tests/engine/breakoutEscapeRun.test.ts
src/tests/engine/breakoutFinalClash.test.ts
src/tests/deterministic/breakoutSession.test.ts
src/tests/deterministic/breakoutAudit.test.ts
src/tests/components/breakoutPlayback.test.tsx
src/tests/components/breakoutStages.test.tsx
src/tests/components/breakoutMedia.test.ts
```

Retain existing tests for unchanged parsing, RNG, stage sizing and asset-failure behavior. Replace old-rules-only expectations on the new live route with the new documented behavior. Do not delete failing tests that exercise behavior still promised here. Do not make a “test” simply assert that an implementation calls itself.

### 10.2 Whole-show invariants and edge cases

- Test every starting count 1–200 over 25 fixed seeds, and 201, 255, 256, 257, 999, 1000 over 100 fixed seeds. Valid runs finish with exactly one original entry as winner; others are eliminated. The pure simulator stays below the 500-event hard cap.
- Cover 0 as invalid; 1 as sole entry; 2/3/4 as direct Final Clash routes; 5/7/9/15/16 as race-only opening routes; 17/20/21/23/31/33/40/41/48/60/61/100/101 as floor routes. No field assumes an even count or twelve racers.
- Include allowed duplicate display names with distinct IDs, NFC-equivalent duplicate detection, emoji, CJK, long names, blank lines and malicious-looking text rendered as text. Names/labels cannot execute markup.
- Across the timeline, no eliminated entry re-enters eligibility; qualifiers remain eligible; no ID disappears or duplicates. Count changes correspond only to documented group eliminations or match completion.
- Compare a normal playthrough, every-event Skip playthrough, mute/reduced-motion playthrough, speed variants and pause/refresh fixtures. All share identical engine results and final winner for the same lock.
- Verify the commitment detects changes to roster, rules, seed or configuration. Audit verification must also detect altered sector assignment, movement value, tie priority, bracket seat, move deal, score, winner or timeline timing.
- Test storage-unavailable behavior, old localStorage session detection/export without mutation, malformed new checkpoints, unknown schema versions and version/commitment mismatches. Never discard recoverable bytes silently.

### 10.3 Probability checks without manufacturing results

Document the symmetry argument: random sector assignment plus uniform hazard selection treats entries exchangeably even with unequal sector sizes; equal independent deck distributions and uniform exact-tie priority do the same in the race; uniform bracket assignment and symmetric move deals do the same in the finale. Variable survival counts and byes must remain part of this argument rather than being hidden.

Run an offline diagnostic of 20,000 distinct fixed master seeds for each N in `[3,5,21,33,61]`, and report winner counts by original entry index, expected count, minimum, maximum and a chi-square statistic. This is a diagnostic, not a proof or a production filter. Do not fail a single random run for being unexciting, reroll a winner, or tune the seed set until the histogram looks ideal. Investigate structural asymmetry if found. Exhaustive six-deal scoring checks and determinism tests remain hard pass/fail checks.

### 10.4 Pacing and manual review

Calculate an estimated runtime from the actual timeline; include speed scaling and exclude optional manual boundary pauses. Plan for roughly 3.5–5.5 minutes for 21–100-entry normal runs under these specified timings, with natural variation from waves, race beats, photo ties and final score. Smaller runs are intentionally shorter. Larger fields may need extra assignment pages and waves; display their honest estimate. Do not add filler to meet a duration target.

Perform one complete shared-screen review at 1280×720 with an odd 33-entry roster and one 61-entry roster, using predetermined seeds. Check name recognition, real group changes, race crossing clarity, simultaneous semifinal readability, and the winning point. Also review a two-entry run and the three-entry seeded-bye explanation. The user should be able to explain each act's objective in one sentence and identify what changed at each resolved beat.

Use these exact project checks:

```sh
pnpm assets:breakout
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Provide the coding handoff result with changed files, checks passed/failed, actual sampled durations, and any remaining defect. Do not report the build complete while an acceptance requirement is knowingly unimplemented. Do not add unspecified alternate modes, powers, online participation, purchases, manual winner controls or extra phases.

## 11. Definition of done

The finished experience shows three different things: a shared floor disaster, a simultaneous escape race, and a scored clash. Every valid positive roster count has an explicit route; odd counts require no repair lottery. Viewers can follow visible state between outcomes and see why each reveal resolved as it did. The last point produces one official winner, and the entire run can be reproduced and verified from its locked record.
