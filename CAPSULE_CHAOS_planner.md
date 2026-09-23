# CAPSULE CHAOS — Build Planner

**Project file:** `CAPSULE_CHAOS_planner.md`  
**Purpose:** Build a fully automated, screen-share-friendly giveaway experience for approximately **30–60 players**, using pasted in-game names as entries. The experience should feel like a tense gacha elimination show with capsule draws, special ability cards, revivals, fake-outs, reversals, plot twists, and a dramatic final reveal while remaining reproducible and auditable.

---

# 1. Product Vision

CAPSULE CHAOS is not a normal random-name picker.

It should feel like a short interactive game show where:

- 30–60 players enter.
- The host pastes a list of in-game names.
- The game validates the list.
- The host clicks **Start Giveaway**.
- The system generates and locks a random game seed.
- The system runs each phase automatically.
- The host normally only needs:
  - **Start**
  - **Pause / Resume**
  - **Next Phase**
  - **Skip Animation**
  - **Emergency Reset**
- The system handles:
  - Capsule draws
  - Elimination
  - Survival
  - Chaos cards
  - Shields
  - Revivals
  - Duels
  - Redirected eliminations
  - Phase transitions
  - Final fake-outs
  - Winner reveal
  - Audit log
- The host should not need to manually track who is alive or eliminated.
- The final result should be determined by the rule engine and random seed, not by host intervention.

The desired emotional progression is:

**Fun → Nervous → Chaotic → Suspenseful → “Wait, WHAT?” → Final tension → Winner**

---

# 2. Core Design Principles

## 2.1 Fairness First

The presentation can be deceptive and dramatic.

The result must not be.

At the moment the host clicks **Start**, the application should:

1. Normalize and lock the entry list.
2. Generate a cryptographically strong seed using the browser crypto API.
3. Generate a SHA-256 commitment/hash of:
   - normalized entry list
   - seed
   - game configuration
4. Display the commitment on-screen.
5. Precompute the entire game event timeline from the seed.
6. Lock the game configuration.
7. Reveal events only as the show progresses.
8. Reveal the original seed and complete event log after the giveaway.

The host may pause presentation but must not be able to alter an already generated result.

### Important

“Fake winner,” “reverse,” “revival,” and “plot twist” events are part of the predefined rules and seeded event sequence.

They must never be inserted manually after a result is known.

---

## 2.2 Drama Without Confusion

The audience should always understand three things:

- **Who is currently active**
- **What just happened**
- **How many players remain**

Every animation should clearly resolve into a final state.

Do not let visual effects hide the actual result.

---

## 2.3 Minimal Host Interaction

Each phase runs by itself.

Recommended host flow:

```text
Paste Entries
    ↓
Validate
    ↓
Start Giveaway
    ↓
PHASE 1 runs automatically
    ↓
[Next Phase]
    ↓
PHASE 2 runs automatically
    ↓
[Next Phase]
    ↓
PHASE 3 runs automatically
    ↓
[Next Phase]
    ↓
Final sequence runs automatically
    ↓
Winner + Audit
```

The host can optionally enable:

**Auto Advance Phases**

If enabled, the entire giveaway can run from beginning to end after one click.

Default: **OFF**, so the host has time to let Discord/voice-chat reactions happen between major phases.

---

# 3. Recommended Technical Architecture

## 3.1 V1 Stack

Recommended:

- **React**
- **TypeScript**
- **Vite**
- CSS modules or Tailwind
- Browser-only application
- No backend required for V1
- Static deployable build

Reason:

- Fast to build.
- Easy to host on Cloudflare Pages / GitHub Pages / Netlify.
- Easy to run locally.
- Deterministic game logic can remain pure TypeScript.
- Animations can be implemented with CSS + Framer Motion or Motion.
- No database is required for one-session giveaways.

### Suggested libraries

- `motion` or `framer-motion` — UI animation
- `howler.js` — sound control
- `zod` — configuration / schema validation
- `nanoid` — internal IDs only, not randomness for winner selection
- native `crypto.getRandomValues()` — seed generation
- native `SubtleCrypto.digest()` — seed commitment hashing

Do not rely on `Math.random()` for game results.

---

# 4. Application Screens

## 4.1 Setup Screen

Purpose:

Prepare the giveaway.

### Required fields

**Giveaway Name**

Example:

```text
September Capsule Chaos
```

**Entries**

Large textarea.

User will paste one in-game name per line.

Example:

```text
DemonBlade
LightBringer
RedDragon
NightFox
Haru
Zero
```

### Entry parser requirements

On paste:

1. Split by line breaks.
2. Trim surrounding whitespace.
3. Remove blank lines.
4. Preserve Unicode.
5. Preserve punctuation within names.
6. Preserve capitalization.
7. Detect duplicate names.
8. Show total valid entries.

Default behavior for duplicates:

- Block Start.
- Highlight duplicates.
- Allow host to explicitly enable:
  - `Allow duplicate entries`

This prevents accidental double entries.

### Entry count

Supported target:

```text
30–60
```

Hard minimum for Capsule Chaos V1:

```text
8
```

Recommended warning below 20:

> Capsule Chaos is designed for larger pools. The experience may be shorter with fewer than 20 entries.

Recommended warning above 100:

> Large pools may create a long opening phase.

### Setup options

- Animation speed:
  - Fast
  - Normal
  - Cinematic
- Sound:
  - On / Off
- Auto Advance Phases:
  - On / Off
- Show full survivor board:
  - On / Off
- Fake-out intensity:
  - Low
  - Standard
  - High

For V1, “Standard” should be the default.

---

# 5. Player Data Model

Each entry becomes a player object.

Suggested shape:

```ts
interface Player {
  id: string;
  displayName: string;
  normalizedName: string;
  entryIndex: number;

  state:
    | "active"
    | "safe"
    | "eliminated"
    | "revived"
    | "finalist"
    | "winner";

  shieldCharges: number;
  secondLifeCharges: number;

  lockedUntilPhase?: number;

  eliminationCount: number;
  revivalCount: number;

  history: PlayerHistoryEvent[];
}
```

Do not identify players only by name.

Internally use stable unique IDs.

This is important if duplicate entries are intentionally allowed.

---

# 6. Deterministic Randomness

Create one seeded deterministic PRNG for all gameplay after the initial secure seed generation.

Suggested flow:

```text
crypto.getRandomValues()
        ↓
secure 256-bit seed
        ↓
hash / normalize seed
        ↓
seeded deterministic PRNG
        ↓
all draws/cards/twists
```

Possible PRNG:

- xoshiro256**
- xoroshiro128+
- mulberry32 only if expanded carefully, but a higher-quality generator is preferred

### Requirement

Given:

- same normalized entries
- same configuration
- same seed

the application must produce:

- identical capsule draws
- identical Chaos Cards
- identical revivals
- identical duel results
- identical winner

This must be covered by automated tests.

---

# 7. Seed Commitment / Audit

At Start:

Display:

```text
GAME LOCKED

Entries: 48
Seed Commitment:
7F3B-91A2-...
```

Do NOT display the actual seed yet.

Store the actual seed in session memory and local session recovery storage.

At the end:

Display:

```text
GAME COMPLETE

Winner:
DemonBlade

Seed:
8d83...

Seed Commitment:
7F3B-91A2-...

[View Audit Log]
[Copy Audit JSON]
```

Audit log should include:

- timestamp
- giveaway name
- entry list
- configuration
- commitment hash
- seed
- event sequence
- winner
- all eliminations
- all revivals
- all special cards
- phase transitions

Optional:

Allow download:

```text
capsule-chaos-audit-YYYY-MM-DD.json
```

---

# 8. Game Flow Overview

For 30–60 players, use adaptive thresholds rather than fixed exact starting counts.

Recommended standard structure:

```text
START
↓
PHASE 1 — THE PURGE
Reduce to 20
↓
PHASE 2 — CHAOS AWAKENS
Reduce to 10
↓
PHASE 3 — SURVIVAL
Reduce to 5
↓
PHASE 4 — FINAL FIVE
Reduce to 3
↓
PHASE 5 — FINAL FATE
Reduce to 2
↓
FINAL — LAST CAPSULE
Winner
```

If the game begins with fewer than 30:

- Phase 1 target becomes approximately 40% of starting players.

If the game begins with more than 60:

- target 20 remains acceptable, but opening draw speed should automatically increase.

---

# 9. PHASE 0 — Game Lock / Opening Ceremony

## Concept

Build anticipation before the first elimination.

## Goal

Confirm that the giveaway is locked and the audience can see the total entry count.

## Sequence

1. Screen fades to black.
2. Giveaway title appears.
3. “Loading Capsules…” text.
4. Capsules populate the machine visually.
5. Counter rapidly rises:
   - 1
   - 6
   - 18
   - 32
   - 48
6. Final message:

```text
48 PLAYERS
1 WINNER

GAME LOCKED
```

7. Seed commitment briefly appears.
8. Countdown:

```text
3
2
1

CAPSULE CHAOS
```

9. Phase 1 begins.

## Animation

### Capsule loading

Use 2D or pseudo-3D colored capsule sprites.

Capsules tumble into a transparent machine bowl.

Movement:

- gravity drop
- bounce
- slight rotation
- small collision feel

No need for full physics simulation.

### Title

Dark background.

Subtle particles.

Title scales from 90% → 105% → 100%.

One heavy impact sound.

### Astra asset needs

- Capsule sprite set:
  - 8–12 color variations
  - transparent PNG/WebP or SVG
- Empty gachapon machine
- Machine foreground glass overlay
- Machine glow overlay
- Background arena
- Title logo
- Lock icon
- Seed-lock icon

---

# 10. PHASE 1 — THE PURGE

## Concept

Fast eliminations.

The audience learns the rules.

No overly complicated abilities yet.

## Goal

Reduce the active pool to:

```text
20 players
```

or, for smaller games:

```text
ceil(startingPlayers × 0.4)
```

minimum target:

```text
12
```

## Rules

Most capsule draws mean:

**ELIMINATED**

Chaos Cards are limited in this phase.

Suggested event frequency:

```text
1 Chaos event every 5 completed eliminations
```

Allowed Phase 1 cards:

- Shield
- Second Life
- Double Trouble
- Revive
- Reverse
- Lucky Escape

Do not allow Legendary effects yet.

## Draw loop

```text
Spin machine
↓
Capsule selected
↓
Capsule opens
↓
Player name reveal
↓
Resolve protection/card
↓
Show result
↓
Update survivor count
↓
2–4 second delay
↓
Next draw
```

## Main capsule animation

1. Machine shakes slightly.
2. Capsules swirl.
3. One capsule falls into chute.
4. Camera/UI zooms toward capsule.
5. Capsule spins.
6. Capsule opens with a pop.
7. Name card rises from capsule.

Timing:

Normal:

```text
2.0–2.8 sec
```

Cinematic:

```text
3.5–4.5 sec
```

## Standard elimination animation

Player name appears center screen.

Pause:

```text
0.5 sec
```

Then:

- red diagonal slash
- capsule cracks
- screen edge flashes red
- name drops downward / fades

Text:

```text
ELIMINATED
```

Survivor counter:

```text
37 REMAINING
```

### Astra assets

- red elimination slash
- cracked capsule
- elimination stamp
- smoke burst
- small debris sprites

---

# 11. Chaos Card System

Every special card has:

```ts
interface ChaosCardDefinition {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  phasesAllowed: number[];
  weight: number;
  description: string;
  targetMode: string;
  effect: GameEffect;
  presentation: CardPresentation;
}
```

Cards should be data-driven.

Do not hardcode card logic into the UI components.

The engine resolves effects.

The UI only animates the already resolved event.

---

# 12. Card Rarity Presentation

## COMMON

Visual:

- white / silver energy
- simple card flip
- minimal screen shake

Duration:

```text
1.5–2 sec
```

## RARE

Visual:

- blue-purple energy
- two-stage card reveal
- particles
- brighter glow

Duration:

```text
2.5–3 sec
```

## EPIC

Visual:

- purple / magenta energy
- screen darkens first
- radial light burst
- card rotates in 3D
- strong bass impact

Duration:

```text
3–4 sec
```

## LEGENDARY

Visual:

- entire screen briefly goes dark
- heartbeat
- thin golden line appears
- card silhouette rises
- screen cracks / energy builds
- golden explosion
- card reveal
- unique title animation

Duration:

```text
5–7 sec
```

Legendary cards should never be used casually.

---

# 13. V1 Chaos Card Deck

The exact probability system should use weights, not fixed physical copies.

The engine should prevent impossible/invalid effects.

Example:

- Revive cannot occur if nobody is eliminated.
- Steal cannot occur if nobody owns a shield.
- Duel cannot select the same player twice.

---

## CARD 01 — SHIELD

**Rarity:** Common

### Effect

The selected player survives the current elimination.

Grant:

```text
Shield Charge = 1
```

If this card appears as a direct rescue, consume immediately.

Alternative future use:

A shield can remain until the next elimination attempt.

### Animation

1. Player appears marked for elimination.
2. Red slash begins.
3. Metallic shield flies in front of name.
4. Slash hits shield.
5. Sparks.
6. Shield remains glowing briefly.
7. Text:

```text
BLOCKED
```

then:

```text
SAFE
```

### Astra assets

- shield
- shield hit sparks
- shield glow
- cracked shield variation

---

## CARD 02 — SECOND LIFE

**Rarity:** Rare

### Effect

Player receives one automatic rescue from a future elimination.

If drawn while player is about to be eliminated:

- player stays alive
- Second Life is consumed immediately

### Animation

1. Player name fades toward black.
2. Heartbeat sound.
3. Red heart/gem cracks.
4. Second glowing core appears behind it.
5. Name returns to full brightness.

Text:

```text
SECOND LIFE
```

then:

```text
NOT YET
```

### Astra assets

- life crystal
- broken life crystal
- revival pulse
- heart/gem glow

---

## CARD 03 — DOUBLE TROUBLE

**Rarity:** Common

### Effect

After the current elimination resolves:

- immediately draw two additional active players
- both are placed into elimination checks

Protection effects can still save them.

### Animation

1. Card flips.
2. Two capsule silhouettes appear.
3. Screen splits left/right.
4. Two capsules drop almost simultaneously.
5. Both names reveal.

Text:

```text
DOUBLE TROUBLE
```

### Astra assets

- mirrored capsule frame
- double-danger icon
- two-arrow downward graphic

---

## CARD 04 — REVIVE

**Rarity:** Rare

### Effect

Select one random eliminated player.

Return them to active play.

Do not select:

- previously permanently locked-out players if such a mechanic exists
- duplicate internal player instance incorrectly

### Animation

1. Entire screen desaturates.
2. Graveyard/list of eliminated names rapidly scrolls.
3. One name stops center screen.
4. White flash.
5. Capsule reconstructs from fragments.
6. Name changes from red/gray to active color.

Text:

```text
BACK FROM CHAOS
```

then:

```text
<PLAYER NAME> RETURNS
```

### Astra assets

- revival portal
- reverse debris
- ghost silhouette
- reconstructing capsule pieces

---

## CARD 05 — REVERSE

**Rarity:** Rare

### Effect

Reverse the current elimination.

The selected player survives.

The next standard elimination draw receives a “marked” status.

Recommended V1 behavior:

The next active player drawn is eliminated normally unless protected.

Do not secretly transfer the current player's identity.

### Animation

1. “ELIMINATED” appears.
2. Audio cuts out.
3. Text visually rewinds backward.
4. Capsule pieces fly back together.
5. Red becomes cyan/blue.
6. Giant:

```text
REVERSE
```

7. Result becomes:

```text
SAFE
```

### Astra assets

- rewind icon
- time reverse ring
- reassembly fragments
- reversed slash animation

---

## CARD 06 — LUCKY ESCAPE

**Rarity:** Common

### Effect

Simple survival.

No stored protection.

Player remains active.

### Animation

Capsule nearly falls into a red “elimination slot.”

At the last moment:

- spring/bounce effect
- capsule jumps into green safe zone

Text:

```text
LUCKY ESCAPE
```

Short and humorous.

---

## CARD 07 — MIRROR

**Rarity:** Epic

### Allowed

Phase 2 onward.

### Effect

The current player's elimination is redirected to another random active player.

The original player survives.

The new target receives the elimination check and may still use protection.

### Animation

1. Elimination slash approaches original player.
2. Glass mirror materializes.
3. Slash hits mirror.
4. Mirror fractures.
5. Red beam redirects to a second player.
6. Second player's name slams onto screen.

Text:

```text
FATE REFLECTED
```

### Astra assets

- mirror
- cracked mirror
- reflected beam
- glass shards

---

## CARD 08 — CHAOS BOMB

**Rarity:** Epic

### Effect

Current player plus two random active players enter a 3-player survival event.

Exactly:

```text
1 survives
2 are eliminated
```

Unless a protection effect alters an individual result.

Recommended implementation:

1. Choose 3 participants.
2. Seeded PRNG chooses one base survivor.
3. Resolve passive protections on the other two.

### Animation

1. Red warning lights.
2. Three capsule slots appear.
3. Three names lock into triangle formation.
4. A fuse burns around them.
5. Explosion.
6. Smoke clears.
7. One capsule remains lit.

Text:

```text
ONLY ONE WALKS AWAY
```

### Astra assets

- stylized bomb
- fuse
- three capsule pedestal
- explosion smoke
- survivor spotlight

---

## CARD 09 — DUEL

**Rarity:** Rare

### Effect

Current player is paired with one random active opponent.

Seed selects a winner.

Loser is eliminated unless protected.

### Animation

1. Current player card slides left.
2. Opponent capsule is drawn and revealed on right.
3. Giant:

```text
VS
```

4. Energy bar fills.
5. Screen flashes.
6. Winning side pushes forward.
7. Losing side shatters/fades.

### Astra assets

- VS graphic
- duel arena
- left/right frames
- impact burst

---

## CARD 10 — STEAL

**Rarity:** Rare

### Effect

If another active player owns a stored Shield or Second Life:

- randomly select one eligible player
- transfer one protection charge to the current player

If nobody owns protection:

- convert to Lucky Escape

### Animation

1. Small shield/life icons appear over eligible players.
2. One icon becomes highlighted.
3. Energy tether pulls icon to current player.
4. Original player icon disappears.

Text:

```text
ABILITY STOLEN
```

### Astra assets

- energy tether
- steal hand/icon
- floating shield token
- floating life token

---

## CARD 11 — NULLIFY

**Rarity:** Epic

### Effect

Cancels the immediately preceding Chaos Card effect if it created a reversible state.

Because complicated retroactive effects can create bugs, V1 should constrain Nullify.

Recommended V1:

Nullify is only generated immediately after one of:

- Double Trouble
- Mirror
- Duel
- Chaos Bomb

The engine should precompute whether the previous event can be cancelled.

### Animation

1. Previous card reappears.
2. Black “X” burns through it.
3. Card dissolves into particles.

Text:

```text
CHAOS DENIED
```

---

## CARD 12 — FINAL PASS

**Rarity:** Epic

### Allowed

Phase 2 or Phase 3 only.

### Effect

Player becomes immune until the next phase boundary.

### Animation

1. Golden ticket/pass spins into view.
2. Gate appears behind player.
3. Player card slides through gate.
4. Gate locks.

Text:

```text
PHASE LOCKED
```

then:

```text
SAFE UNTIL NEXT PHASE
```

### Astra assets

- gold pass/ticket
- gate
- lock seal

---

## CARD 13 — GHOST RETURN

**Rarity:** Epic

### Effect

Revive one eliminated player.

However:

The revived player is marked **Fragile**.

Their next elimination attempt ignores ordinary Shield, but Second Life still works.

V1 can simplify if needed:

- Ghost Return player simply returns with no stored protection.

### Animation

1. Dark mist.
2. Transparent player name rises from lower screen.
3. Name flickers.
4. Capsule reforms in black/white.
5. Color returns partially.

Text:

```text
THE GHOST RETURNS
```

---

## CARD 14 — FATE SWAP

**Rarity:** Epic

### Effect

Current player and one random active player swap their immediate fate state.

Recommended V1 behavior:

If current player is about to be eliminated:

- random opponent becomes the elimination target
- current player survives

This is similar to Mirror but visually distinct.

Do not use both cards too frequently.

### Animation

1. Two player panels lock onto screen.
2. Their nameplates spin around each other.
3. Red danger aura moves from one to the other.

Text:

```text
FATE SWAPPED
```

---

## CARD 15 — SYSTEM OVERRIDE

**Rarity:** Legendary

### Allowed

Final 10 onward.

### Effect

One of several seeded sub-effects:

- Rescue current player
- Revive one player
- Trigger sudden duel
- Trigger no-elimination fake-out

The selected sub-effect must be resolved by the game engine before presentation.

### Animation

1. UI appears to malfunction.
2. Colors disappear.
3. Fake terminal/system text:

```text
RESULT REJECTED
OVERRIDE DETECTED
RECALCULATING...
```

4. Screen glitch.
5. Legendary card descends.
6. Gold/red burst.
7. Sub-effect reveals.

### Astra assets

- glitch frames
- terminal overlay
- override emblem
- legendary energy burst

---

## CARD 16 — JACKPOT

**Rarity:** Legendary

### Allowed

Final 5 onward.

### Effect

This card should NOT automatically create two prize winners unless the giveaway explicitly supports multiple prizes.

Recommended V1 default:

**Jackpot = maximum survival twist**, not a second real prize.

Effect:

- current player survives
- one eliminated player returns
- both receive no additional protection

If the giveaway configuration has:

```text
Allow Double Winner = ON
```

then Jackpot can optionally produce a double winner only during the final reveal.

Default:

```text
Allow Double Winner = OFF
```

### Animation

1. Slot-machine / gacha lights activate.
2. Capsule becomes gold.
3. Coins/stars burst.
4. Large:

```text
JACKPOT
```

5. Rule text appears clearly.

### Astra assets

- gold capsule
- jackpot burst
- star/coin particles
- legendary frame

---

# 14. PHASE 2 — CHAOS AWAKENS

## Concept

The audience now understands basic elimination.

Special abilities become more dangerous.

## Goal

Reduce:

```text
20 → 10
```

## Event pacing

Slower than Phase 1.

Recommended:

```text
3–5 seconds between standard events
```

Chaos frequency:

```text
approximately 1 Chaos event every 2–3 eliminations
```

Allowed:

- all Common
- all Rare
- selected Epic
- no Legendary unless Fake-out Intensity = High

## Opening animation

At phase start:

1. Survivor board shows all 20.
2. Screen dims.
3. “The rules are changing.”
4. Cards appear face-down around the machine.
5. One pulses.
6. Title:

```text
PHASE II
CHAOS AWAKENS
```

### Astra assets

- ring of face-down cards
- chaos symbol
- phase title plate

---

# 15. Survivor Board

From Phase 2 onward, the display should maintain a visual roster.

For 20 players:

- compact grid
- 4–5 columns
- name text only or capsule + name

States:

**Active**
- bright
- full opacity

**Protected**
- shield/life icon

**Marked**
- red outline

**Eliminated**
- gray/red
- line-through
- fade after 2 seconds

**Revived**
- pulse white/green
- “RETURNED” tag briefly

When player count is 10 or less:

Make each player tile larger.

---

# 16. PHASE 3 — SURVIVAL

## Concept

Every remaining name matters.

The pace slows substantially.

## Goal

Reduce:

```text
10 → 5
```

## Rules

Chaos chance increases.

No more rapid machine spam.

Every draw should feel important.

Recommended flow per draw:

```text
machine spin
↓
capsule suspense
↓
name reveal
↓
0.8–1.5 sec pause
↓
result / Chaos event
↓
survivor board update
↓
5–8 sec reaction window
```

## Visual style

- darker arena
- larger central capsule
- survivor names around screen edge
- stronger spotlight
- less background movement

## Animation

Before every draw:

Counter:

```text
8 REMAINING
```

Then:

```text
NEXT FATE
```

Machine slowly rotates.

Capsule drops.

### Dramatic near-miss

Occasionally, as a presentation-only animation:

- one capsule almost enters chute
- bounces away
- another capsule drops

This must NOT alter the predetermined result.

The actual selected capsule/player was already determined.

---

# 17. PHASE 4 — FINAL FIVE

## Concept

Reverse audience expectations.

## Goal

Reduce:

```text
5 → 3
```

## Rule twist

At the beginning of the phase:

Display:

```text
NEW RULE

FROM NOW ON...

THE CAPSULE DRAWN IS SAFE
```

This reverses the meaning of the machine.

### Important

The UI must make this extremely clear.

The three drawn capsules advance.

The two left behind eventually face elimination.

Recommended format:

1. Five player capsules visibly arranged.
2. Machine randomly chooses one.
3. Selected player becomes SAFE.
4. Remove them from danger pool.
5. Repeat until 3 are safe.
6. Remaining 2 receive a mini sudden-death event.
7. One survives into Final 3.

Alternative simpler version:

Continue selecting safe players until exactly 3 remain and eliminate the final two.

For greater suspense, use sudden death between the last two.

## Animation

Selected capsule drops.

Audience expects elimination.

Red light begins.

Then it snaps green:

```text
SAFE
```

First draw of Phase 4 should deliberately hold the red color for about 0.8 sec to exploit prior expectations.

Do not label them “Eliminated” first.

The fake-out is visual anticipation, not misinformation.

---

# 18. PHASE 5 — FINAL FATE

## Concept

Final 3.

One player must be removed, but the game should support one major seeded plot twist.

## Goal

```text
3 → 2
```

## Allowed events

Weighted pool:

- Normal elimination
- Reverse
- Duel
- System Override
- Revival challenge
- Fate Swap

Only one Legendary event maximum in this phase.

## Recommended structure

Three finalist capsules stand on pedestals.

One is selected.

Before the result resolves:

```text
FINAL FATE CHECK
```

A card appears.

Possible result examples:

### Normal

```text
FINAL FATE:
ELIMINATED
```

### Reverse

```text
FINAL FATE:
REVERSED

<player> survives.
```

Then choose a valid replacement target.

### Duel

Selected player challenges one of the other finalists.

Winner advances.

Loser is eliminated.

---

# 19. FINAL — LAST CAPSULE

## Concept

Final two.

Maximum tension.

## Goal

Reveal one real winner.

## Important Rule

The final winner is already determined by the precomputed event timeline.

The UI may create fake-outs, but the game cannot allow host input to change the result.

## Final layout

Two large finalist panels:

```text
PLAYER A        PLAYER B
```

Two capsules enter a separate final chamber.

Music stops.

Heartbeat begins.

Countdown:

```text
3
2
1
```

Machine spins.

One capsule drops.

---

# 20. Final Fake-Out System

Fake-outs are presentation sequences tied to seeded Final Fate events.

They should never be manually triggered.

## Fake-out Type A — False Celebration

1. Capsule reveals Player A.
2. Text:

```text
WINNER
```

3. Confetti begins for 1.5–2.5 sec.
4. Sound abruptly cuts.
5. Screen freezes.
6. Glitch.
7. Text:

```text
RESULT NOT FINAL
```

8. Final Fate card appears.
9. Actual rule resolves.
10. True winner animation plays.

Use sparingly.

---

## Fake-out Type B — Error / Recalculation

1. Winner appears to be calculating.
2. Loading reaches 99%.
3. Error beep.
4. Screen:

```text
FATE CONFLICT
```

5. Final Fate card drops.
6. Recalculation resolves.

---

## Fake-out Type C — Capsule Refuses to Open

1. Final capsule drops.
2. Capsule tries to open.
3. It locks.
4. Red warning icon.
5. Legendary glow begins.
6. Capsule explodes into Final Fate card.

---

## Fake-out Type D — Double Reveal

1. One capsule drops.
2. A second capsule unexpectedly drops.
3. Both names appear.
4. Screen:

```text
IMPOSSIBLE RESULT
```

5. Final rule resolves:
   - duel
   - reverse
   - jackpot
   - true winner

---

# 21. True Winner Animation

This must be unmistakably different from fake winner sequences.

## Requirements

Final true winner reveal includes:

1. Full-screen gold/white burst.
2. Winner name remains on-screen for at least 6 seconds.
3. Explicit text:

```text
OFFICIAL WINNER
```

4. Confetti.
5. Crown / champion capsule.
6. Audit commitment transitions to:

```text
RESULT VERIFIED
```

7. Seed becomes available.

Do not use `OFFICIAL WINNER` during fake-outs.

That phrase is reserved for the irreversible result.

### Astra assets

- champion crown
- winner pedestal
- final gold capsule
- confetti
- victory rays
- official winner frame
- result verified seal

---

# 22. Audio Plan

All sounds should have a global mute toggle.

Recommended categories:

## UI

- click
- hover
- lock
- error

## Gachapon

- machine rotation
- capsule collisions
- capsule drop
- capsule open

## Drama

- heartbeat
- low rumble
- tension riser
- silence/drop effect

## Card rarity

Common:
- simple flip

Rare:
- sparkle + bass tick

Epic:
- energy charge + impact

Legendary:
- long charge + deep hit + shimmer

## Results

- elimination
- safe
- shield hit
- revival
- duel
- legendary
- true winner

Codex should implement audio through a centralized audio service so assets can be replaced later without rewriting event logic.

---

# 23. Asset Naming Convention

Astra should export assets using predictable names.

Example:

```text
/assets/
  background/
    bg_arena_main.webp
    bg_arena_final.webp

  machine/
    gachapon_base.webp
    gachapon_glass.webp
    gachapon_chute.webp

  capsules/
    capsule_red.webp
    capsule_blue.webp
    capsule_green.webp
    capsule_gold.webp

  cards/
    card_back.webp
    card_common_frame.webp
    card_rare_frame.webp
    card_epic_frame.webp
    card_legendary_frame.webp

  effects/
    fx_elimination_slash.webm
    fx_shield_hit.webm
    fx_revival.webm
    fx_reverse.webm
    fx_glitch.webm
    fx_legendary_burst.webm
    fx_winner_confetti.webm

  icons/
    icon_shield.svg
    icon_second_life.svg
    icon_revive.svg
    icon_duel.svg

  audio/
    sfx_capsule_drop.ogg
    sfx_card_flip.ogg
    sfx_elimination.ogg
    sfx_winner.ogg
```

For animated transparent effects, preferred formats:

1. WebM with alpha where browser compatibility is acceptable
2. Lottie JSON for vector-like effects
3. PNG/WebP frame sequences only when needed

Avoid huge GIF files.

---

# 24. Astra Visual Style Brief

The visual identity should be:

- original
- modern arcade / gacha
- dark background
- neon accents
- glossy capsules
- readable on Discord screen share
- high contrast
- large text
- no tiny decorative text
- no visual dependence on copyrighted game branding

Recommended mood:

```text
Dark game-show arena
+
gachapon machine
+
arcade rarity effects
+
clean esports-style typography
```

Avoid:

- anime characters unless explicitly added later
- crowded HUD
- excessive gradients behind text
- tiny status indicators
- unreadable particle overload

---

# 25. Resolution and Responsive Requirements

Primary target:

```text
1920 × 1080
16:9
```

The experience should look excellent while screen-shared.

Also support:

- 2560 × 1440
- ultrawide screens by letterboxing the game stage
- browser resizing

Recommended stage:

```text
16:9 fixed logical canvas
```

Scale the canvas to fit browser viewport.

Do not stretch.

---

# 26. State Machine Architecture

Do not implement game flow through scattered timers.

Use an explicit finite state machine / reducer.

Example top-level states:

```text
SETUP
LOCKING
INTRO
PHASE_1
PHASE_1_COMPLETE
PHASE_2
PHASE_2_COMPLETE
PHASE_3
PHASE_3_COMPLETE
PHASE_4
PHASE_4_COMPLETE
PHASE_5
FINAL
WINNER
AUDIT
PAUSED
```

Each phase consumes a precomputed queue of `GameEvent` objects.

Suggested event types:

```ts
type GameEvent =
  | CapsuleSpinEvent
  | PlayerRevealEvent
  | EliminationEvent
  | SafeEvent
  | CardRevealEvent
  | ShieldEvent
  | RevivalEvent
  | DuelEvent
  | PhaseTransitionEvent
  | FakeWinnerEvent
  | FinalFateEvent
  | WinnerEvent;
```

---

# 27. Event Timeline Model

Precompute:

```ts
interface TimelineEvent {
  id: string;
  sequence: number;
  phase: number;
  type: GameEventType;
  participants: string[];
  payload: Record<string, unknown>;
  presentationKey: string;
  minimumDurationMs: number;
}
```

The UI reads the timeline.

The game engine should NOT make new random decisions while animations are running.

This separation is critical.

### Correct

```text
Seed
→ Engine computes outcome
→ Timeline event generated
→ Renderer animates event
```

### Avoid

```text
Animation runs
→ component calls random()
→ outcome changes
```

---

# 28. Auto-Run Scheduler

Inside a phase:

- events advance automatically
- every event has a minimum display duration
- scheduler waits for animation completion
- then advances to next event

Host controls:

## Pause

Stops advancement after current animation safely finishes.

## Resume

Continues event scheduler.

## Skip Animation

Immediately resolves current visual animation to its end state.

It must NOT skip the underlying event.

## Next Phase

Enabled only when the current phase has completed.

## Emergency Reset

Requires confirmation.

Recommended:

```text
Hold for 3 seconds
```

or:

```text
Type RESET
```

Do not provide an easy accidental restart button during a live giveaway.

---

# 29. Recovery After Browser Refresh

A browser refresh should not destroy a live giveaway.

Persist session state in:

```text
localStorage or IndexedDB
```

Persist:

- normalized entries
- seed
- commitment
- configuration
- precomputed timeline
- current event index
- player states
- phase
- winner if resolved

On reload:

```text
Active giveaway found.

[RESUME GIVEAWAY]
[ABANDON SESSION]
```

Resuming must reproduce exactly the same state.

---

# 30. Anti-Accidental-Rigging UX

Once Start is clicked:

Disable:

- entry editing
- card weights
- phase thresholds
- animation influence on outcome
- winner reroll
- seed regeneration

Do not include:

- “Pick another winner”
- “Reroll”
- “Force winner”
- “Select player”
- hidden winner override

For testing, developer-only fixtures may exist, but production UI must not expose result manipulation controls.

---

# 31. Configuration and Balance

The gameplay engine should use a configuration object.

Example:

```ts
interface GameConfig {
  phase1Target: number;
  phase2Target: number;
  phase3Target: number;
  phase4Target: number;
  phase5Target: number;

  fakeoutIntensity: "low" | "standard" | "high";

  chaosWeights: Record<string, number>;

  animationSpeed: "fast" | "normal" | "cinematic";

  allowDoubleWinner: boolean;
}
```

Default:

```text
allowDoubleWinner = false
```

V1 should produce exactly one official winner unless explicitly configured otherwise.

---

# 32. Recommended Default Balance for 30–60 Players

These are target behaviors, not exact guaranteed counts.

## Phase 1

Chaos event rate:

```text
~20%
```

Mostly:

- Shield
- Lucky Escape
- Double Trouble

Revive should be uncommon.

## Phase 2

Chaos event rate:

```text
~35%
```

Introduce:

- Duel
- Mirror
- Steal
- Final Pass

## Phase 3

Chaos event rate:

```text
~45%
```

Epic effects become possible.

## Final 5 onward

Chaos event rate:

```text
~50–65%
```

But cap total Legendary events:

```text
Maximum 2 per game
```

Recommended:

- maximum 1 before Final 5
- maximum 1 during Final sequence

This prevents every event from feeling “special.”

---

# 33. Plot Twist Rules

Plot twists should be surprising but bounded.

## Rule 1

No infinite revival loops.

Maximum player revivals:

```text
2 per player
```

Recommended default:

```text
1
```

## Rule 2

Phase targets must still converge.

The engine must guarantee progression.

Example:

If Phase 2 target is 10:

- temporary revival to 11 is allowed
- engine must continue until active count returns to 10

## Rule 3

Do not allow Chaos Cards to create impossible player counts.

## Rule 4

Do not let the same player be selected for a special effect repeatedly due to unlucky randomness.

Optional “drama smoothing”:

After a player is involved in a special event:

```text
reduce special-target weight for next 2 events
```

This is not necessary for fairness but improves show quality.

If implemented, it must be part of the deterministic rules.

---

# 34. Audience Clarity

Always show:

Top-left:

```text
PHASE III — SURVIVAL
```

Top-right:

```text
8 REMAINING
```

Bottom or corner:

```text
GAME LOCKED
```

During special cards:

Display one sentence explaining the effect.

Example:

```text
MIRROR
This elimination is redirected to another player.
```

Do not require the audience to memorize the deck.

---

# 35. Accessibility

Provide:

- Reduced Motion option
- Sound mute
- readable text contrast
- avoid red/green as the only state indicator
- icons + labels
- keyboard controls

Suggested keys:

```text
Space = Pause / Resume
N = Next Phase
S = Skip Animation
F = Fullscreen
M = Mute
```

Emergency Reset should have no single-key shortcut.

---

# 36. Fullscreen / Screen Share Mode

Provide button:

```text
ENTER SHOW MODE
```

Show Mode should:

- hide setup controls
- hide browser-like internal admin panels
- make cursor disappear after inactivity
- maximize stage
- prevent text selection
- prevent accidental right-click UI
- optionally request browser fullscreen

Show Mode must still allow:

- Space = pause
- N = next phase
- S = skip animation
- Esc = exit fullscreen

---

# 37. Optional Controller Mode — Post-V1

Not required for first release.

Future architecture could support:

```text
/play
/control
```

A remote controller on a phone requires shared session state over:

- WebSocket
- Supabase realtime
- Firebase
- Cloudflare Durable Object
- small custom backend

Do not add this complexity to V1 unless specifically requested.

---

# 38. Implementation Phases for Codex

---

## BUILD STEP 1 — Project Skeleton

**Status:** ✅ COMPLETED

### Concept

Create a clean React/TypeScript application with routing and a logical 16:9 stage.

### Deliverables

- React + TypeScript project
- ESLint
- formatting
- test framework
- `/setup`
- `/game`
- basic global state
- 16:9 scalable stage
- placeholder asset folders

### Expected outcome

The app runs locally and displays the Setup and Game screens.

No gameplay yet.

### Acceptance criteria

- `npm run dev` works
- `npm run build` succeeds
- TypeScript has no errors
- stage remains 16:9 at common viewport sizes

---

## BUILD STEP 2 — Entry Import / Validation

**Status:** ✅ COMPLETED

### Concept

Allow the host to paste player names.

### Deliverables

- textarea
- parser
- duplicate detection
- Unicode-safe handling
- entry count
- error messages
- normalized internal entries

### Expected outcome

Pasting 30–60 names produces a validated player roster.

### Acceptance criteria

Given:

```text
Alpha

Bravo
Charlie
```

Result:

```text
3 valid entries
```

Whitespace-only lines are ignored.

Unicode names remain unchanged.

Duplicates block Start by default.

---

## BUILD STEP 3 — Seed / Commitment System

**Status:** ✅ COMPLETED

### Concept

Lock the giveaway before gameplay.

### Deliverables

- secure seed generation
- deterministic PRNG
- configuration serialization
- SHA-256 commitment
- seed reveal after game
- deterministic test suite

### Expected outcome

Same seed + same entries + same config always produces identical random values.

### Acceptance criteria

Run deterministic test 100 times.

Expected timeline hashes must match exactly.

---

## BUILD STEP 4 — Core Game Engine

**Status:** ✅ COMPLETED

### Concept

Create a UI-independent simulation engine.

### Deliverables

- player state reducer
- phase targets
- elimination logic
- protection logic
- revival logic
- target selectors
- card effect registry
- convergence safeguards

### Expected outcome

The complete game can be simulated from Start to Winner without rendering UI.

### Acceptance criteria

For 1,000 generated games using 30–60 entries:

- exactly one winner exists
- game always terminates
- no invalid active player references
- no negative counts
- no eliminated player is treated active unless revived
- phase target logic converges

---

## BUILD STEP 5 — Timeline Generator

**Status:** ✅ COMPLETED

### Concept

Convert simulation results into renderable event sequences.

### Deliverables

- `TimelineEvent`
- event sequence generator
- presentation keys
- duration metadata
- final audit event stream

### Expected outcome

The renderer never performs gameplay randomness.

### Acceptance criteria

All random calls happen before timeline playback.

---

## BUILD STEP 6 — Base Gachapon Animation

**Status:** ✅ COMPLETED

### Concept

Implement the core capsule-draw visual.

### Deliverables

- machine
- capsule swirl
- chute drop
- capsule open
- name reveal
- placeholder assets if Astra assets are not ready

### Expected outcome

One timeline draw can be played start to finish.

### Acceptance criteria

Animation resolves correctly under:

- normal speed
- cinematic speed
- skip
- pause

---

## BUILD STEP 7 — Phase 1

**Status:** ✅ COMPLETED

### Concept

Implement full Purge gameplay.

### Deliverables

- autoplay loop
- standard elimination
- survivor count
- initial Chaos Cards
- Phase 1 completion screen
- Next Phase button

### Expected outcome

A 50-player pool automatically reaches 20.

### Acceptance criteria

No host input required during the phase.

---

## BUILD STEP 8 — Card Presentation System

**Status:** ✅ COMPLETED

### Concept

Build reusable card animation architecture.

### Deliverables

- common reveal
- rare reveal
- epic reveal
- legendary reveal
- reusable card container
- card description display

### Expected outcome

Adding a new card requires primarily:

- card definition
- effect handler
- presentation config

not rebuilding the screen.

---

## BUILD STEP 9 — All V1 Cards

**Status:** ✅ COMPLETED

### Concept

Implement all 16 card behaviors.

### Deliverables

- every card effect
- eligibility validator
- fallback behavior
- effect tests
- player state integration

### Expected outcome

No generated card can produce an invalid game state.

---

## BUILD STEP 10 — Phase 2 / Survivor Board

**Status:** ✅ COMPLETED

### Concept

Introduce visual roster and heavier chaos.

### Deliverables

- survivor grid
- status icons
- Phase 2 opening
- Phase 2 auto progression
- shield/life markers

### Expected outcome

The audience can track the remaining pool easily.

---

## BUILD STEP 11 — Phase 3

**Status:** ✅ COMPLETED

### Concept

Slow pacing and emphasize every draw.

### Deliverables

- darker visual mode
- slower draws
- reaction windows
- near-miss presentation effect
- larger player tiles

### Expected outcome

The final 10 → 5 feels noticeably more tense than the opening.

---

## BUILD STEP 12 — Phase 4 Rule Reversal

**Status:** ✅ COMPLETED

### Concept

Drawn capsule becomes safe.

### Deliverables

- rule announcement
- safe draw animation
- red-to-green anticipation fake
- final reduction to 3

### Expected outcome

Audience clearly understands the reversed rule.

---

## BUILD STEP 13 — Final Fate

**Status:** ✅ COMPLETED

### Concept

Run Final 3 → Final 2 with one major twist opportunity.

### Deliverables

- finalist pedestals
- Final Fate card
- Duel
- Reverse
- System Override
- final-two handoff

### Expected outcome

The final 3 feels unique rather than like another normal elimination.

---

## BUILD STEP 14 — Final Two / Fake-Out Engine

**Status:** ✅ COMPLETED

### Concept

Create dramatic winner presentation without compromising fairness.

### Deliverables

- final chamber
- heartbeat sequence
- fake celebration
- glitch reveal
- recalculation
- capsule refusal
- double-reveal sequence
- official winner distinction

### Expected outcome

The system can produce multiple visually different final sequences from the seeded timeline.

---

## BUILD STEP 15 — True Winner / Audit

**Status:** ✅ COMPLETED

### Concept

Clearly end the game.

### Deliverables

- OFFICIAL WINNER screen
- winner animation
- seed reveal
- commitment verification
- audit view
- JSON export

### Expected outcome

Audience and host can distinguish the final irreversible result from theatrical fake-outs.

---

## BUILD STEP 16 — Pause / Resume / Skip / Recovery

**Status:** ✅ COMPLETED

### Concept

Make the system safe during a live call.

### Deliverables

- pause
- resume
- skip animation
- Next Phase
- emergency reset
- local persistence
- refresh recovery

### Expected outcome

Refreshing the browser in the middle of Phase 3 can resume the same giveaway.

---

## BUILD STEP 17 — Astra Asset Integration

**Status:** ✅ COMPLETED

### Concept

Replace placeholders with production visuals.

### Deliverables

- centralized asset manifest
- all image paths
- animation assets
- audio assets
- fallback assets
- preload strategy

### Expected outcome

Asset replacements do not require game engine code changes.

---

## BUILD STEP 18 — Performance / Polish

**Status:** ✅ COMPLETED

### Concept

Prepare for real screen sharing.

### Deliverables

- preload critical assets
- animation frame profiling
- eliminate layout shifts
- prevent long blocking tasks
- compressed assets
- full-screen testing
- 1080p testing

### Expected outcome

Smooth show on a normal modern desktop browser.

Target:

```text
60 FPS where practical
```

No visible stutters during capsule reveal.

---

# 39. Test Matrix

Test entry sizes:

```text
8
20
30
48
60
100
```

Primary supported:

```text
30
48
60
```

For every size test:

- 100–1,000 deterministic simulations
- no crashes
- exactly one winner
- all players accounted for
- no invalid card targets
- no phase deadlocks

---

# 40. Special Edge Cases

Codex must explicitly test:

1. Duplicate names intentionally allowed.
2. Emoji in player names.
3. Vietnamese characters.
4. Chinese/Japanese/Korean characters.
5. Very long names.
6. Name consisting mostly of punctuation.
7. Revive when only one player is eliminated.
8. Steal with no protection owners.
9. Chaos Bomb with fewer than 3 eligible participants.
10. Duel at Final 2.
11. Legendary card eligibility.
12. Pause during card reveal.
13. Refresh during winner fake-out.
14. Skip during revival animation.
15. Browser tab loses focus.
16. Audio file fails.
17. Asset fails to load.
18. Local storage is unavailable.
19. User accidentally tries to start with fewer than minimum entries.

---

# 41. Simulation Safeguards

The game engine should have a hard event cap.

Example:

```text
MAX_GAME_EVENTS = 500
```

If exceeded:

- terminate simulation
- show developer error
- do not start live playback

Never enter an infinite loop.

---

# 42. Development Debug Mode

Codex may implement a development-only panel.

Allowed in `development` mode:

- seed input
- force starting player count
- jump to phase
- replay event
- inspect state
- slow motion

Must not be present in production build.

Production build should verify:

```text
import.meta.env.PROD
```

and exclude developer manipulation UI.

---

# 43. Suggested Folder Structure

```text
src/
  app/
    App.tsx
    routes.tsx

  game/
    engine/
      simulateGame.ts
      rng.ts
      seed.ts
      commitment.ts
      phaseRules.ts
      selectors.ts

    cards/
      cardDefinitions.ts
      cardRegistry.ts
      effects/
        shield.ts
        revive.ts
        duel.ts
        mirror.ts
        ...

    timeline/
      buildTimeline.ts
      eventTypes.ts

    state/
      gameReducer.ts
      gameStore.ts
      persistence.ts

  components/
    GachaponMachine/
    Capsule/
    ChaosCard/
    SurvivorBoard/
    PlayerTile/
    PhaseBanner/
    WinnerScreen/
    AuditPanel/

  presentation/
    eventRenderer.tsx
    presentationRegistry.ts
    animationDurations.ts

  audio/
    AudioManager.ts

  assets/
    manifest.ts

  pages/
    SetupPage.tsx
    GamePage.tsx

  tests/
    engine/
    cards/
    deterministic/
    simulation/
```

---

# 44. Core Separation Rule

Codex must maintain three separate layers:

## Layer 1 — Game Engine

Determines:

```text
WHAT happened
```

No UI.

No animation.

No sound.

## Layer 2 — Timeline

Determines:

```text
IN WHAT ORDER the audience sees it
```

Still no actual DOM animation.

## Layer 3 — Presentation

Determines:

```text
HOW it looks and sounds
```

This architecture is mandatory because Astra will provide visual assets independently.

It also prevents animation changes from affecting game results.

---

# 45. Astra Asset Deliverables by Priority

**Media status:** Original Priority 1–3 pack installed in `public/assets` (73 files, approximately 1.36 MB). Includes two generated WebP arenas, 53 scalable SVG assets/effect plates, and 18 original WAV sound cues. Runtime integration, fallbacks, mute and reduced motion are covered by tests. See `ASTRA_ASSET_MAP.md` and `docs/MEDIA_PROVENANCE.md`; preview at `/docs/media-preview.html` using the development server. Effects use timeline-controlled CSS animation rather than pre-rendered video.

## Priority 1 — Required for first playable build

- game background
- gachapon machine
- standard capsule
- gold capsule
- card back
- common frame
- rare frame
- epic frame
- legendary frame
- elimination slash
- shield
- revival effect
- winner frame
- confetti

## Priority 2 — Card-specific effects

- mirror
- chaos bomb
- duel
- reverse
- steal
- override
- jackpot
- final pass
- second life

## Priority 3 — Polish

- particles
- transition wipes
- screen-glitch variations
- smoke
- lightning
- ambient effects

---

# 46. Asset Brief Template for Astra

Each animation asset request should contain:

```text
Asset:
Shield Hit

Purpose:
Shown when a player would be eliminated but Shield blocks it.

Duration:
1.2 seconds

Canvas:
1920x1080 overlay OR tightly cropped transparent asset.

Background:
Transparent.

Sequence:
1. Shield enters from lower-right.
2. Red slash hits center.
3. Sparks explode.
4. Shield recoils.
5. Glow fades.

Loop:
No.

End state:
Transparent / clean exit.

Style:
Dark arcade gacha, polished, dramatic, no text.

Text added by website:
BLOCKED
SAFE
```

Astra should generally avoid baking player names or rule text into visual assets.

Codex will render text dynamically.

---

# 47. Recommended Game Duration

For approximately 48 players on Normal speed:

Target:

```text
10–15 minutes
```

Approximate:

Phase 0:

```text
20–30 sec
```

Phase 1:

```text
3–4 min
```

Phase 2:

```text
3–4 min
```

Phase 3:

```text
2–3 min
```

Final Five / Final Fate / Final:

```text
2–4 min
```

Fast mode target:

```text
6–9 min
```

Cinematic:

```text
15–20 min
```

---

# 48. Exact V1 Host Workflow

## Before call

1. Open site.
2. Paste in-game player list.
3. Confirm count.
4. Resolve duplicates.
5. Choose animation speed.
6. Enable/disable sound.
7. Enter Show Mode.

## Live

Host clicks:

```text
START GIVEAWAY
```

Phase 0 and Phase 1 run automatically.

At phase boundary:

```text
PHASE I COMPLETE
20 SURVIVORS

[NEXT PHASE]
```

Host clicks Next Phase.

Repeat.

Final sequence plays automatically.

Host never chooses:

- who is eliminated
- who is revived
- who gets a card
- card type
- duel winner
- final winner

---

# 49. Phase Completion Screens

Each phase boundary should be a natural pause for voice chat.

Example:

```text
PHASE I COMPLETE

20 SURVIVORS

THE EASY PART IS OVER.

[NEXT PHASE]
```

Phase 2:

```text
10 REMAIN.

FROM THIS POINT,
EVERY CAPSULE MATTERS.

[NEXT PHASE]
```

Phase 3:

```text
FINAL FIVE

THE RULES ARE ABOUT TO CHANGE.

[NEXT PHASE]
```

These screens give the host control without requiring game management.

---

# 50. V1 Definition of Done

CAPSULE CHAOS V1 is complete when:

1. Host can paste 30–60 in-game names.
2. App validates and locks entries.
3. Start generates secure seed and commitment.
4. Full game outcome is deterministically generated.
5. Phase 1 runs automatically.
6. Phase 2 runs automatically.
7. Phase 3 runs automatically.
8. Final Five rule reversal works.
9. Final Fate works.
10. Final fake-outs work.
11. Exactly one official winner is produced by default.
12. Host can pause/resume.
13. Host can skip visual animations.
14. Host can control phase progression with Next Phase.
15. Refresh recovery works.
16. Audit log proves event sequence from seed.
17. No production winner override exists.
18. All card effects are tested.
19. Astra assets can be swapped through the asset manifest.
20. UI is usable at 1920×1080 screen share resolution.

---

# 51. Recommended First Codex Implementation Order

Codex should NOT begin with elaborate animation.

Build in this order:

```text
1. Entry parser
2. Seed + deterministic RNG
3. Game state model
4. Phase rules
5. Card engine
6. Full headless simulation
7. Simulation tests
8. Timeline generator
9. Basic UI
10. Base capsule animation
11. Card animations
12. Final sequence
13. Audio
14. Persistence
15. Production assets
16. Performance polish
```

The engine must be proven before adding heavy visual work.

---

# 52. Codex Handoff Instruction

Use the following instruction when handing this planner to Codex:

> Implement CAPSULE CHAOS according to this planner. Treat the game engine, deterministic randomness, phase rules, card effects, auditability, and separation between engine/timeline/presentation as required architecture. Build the deterministic headless simulation and tests before investing in production animation. Do not add any host-facing winner override, reroll control, or manual result manipulation. Use placeholder visuals where Astra assets are not yet available, and centralize all asset references so production assets can be swapped later without changing gameplay logic. If an implementation detail in the current repository conflicts with this planner, report the conflict before redesigning the architecture.

---

# 53. Astra Handoff Instruction

Use this planner as the master visual behavior specification.

Astra should create assets for:

- phases
- capsule machine
- capsule states
- Chaos Card rarity levels
- each card effect
- elimination
- revival
- fake-outs
- Final Fate
- official winner

Astra should not decide game outcomes.

The website determines:

```text
WHO
WHAT
WHEN
```

Astra assets determine:

```text
HOW IT LOOKS
```

Animations should be modular and reusable.

Avoid embedding player names or dynamic text inside generated visual assets.

---

# 54. Final Product Experience

When complete, the live experience should feel like this:

```text
48 PLAYERS
↓
Machine fills with capsules
↓
Game locks
↓
Fast eliminations
↓
Unexpected Shield
↓
Double Trouble
↓
Revival
↓
20 remain
↓
Chaos Cards intensify
↓
Duel
↓
Mirror
↓
Final Pass
↓
10 remain
↓
Slow survival round
↓
5 remain
↓
Rules reverse
↓
3 remain
↓
Final Fate
↓
2 finalists
↓
App appears to reveal winner
↓
Glitch
↓
Final Fate twist
↓
OFFICIAL WINNER
↓
Seed + audit verification
```

The important design goal is:

**The audience should never know whether the next capsule means elimination, rescue, revival, duel, or a major plot twist — but the software must always know exactly what happens because the result was locked at the start.**
