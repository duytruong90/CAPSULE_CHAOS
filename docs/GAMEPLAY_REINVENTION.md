# Capsule Chaos: Breakout — gameplay proposal

Status: proposed replacement, with an interactive concept demonstration. This is
not implemented in the production game. The demonstration uses illustrative
names and a fixed example sequence; it is not an audited giveaway.

## The problem

The current first three engine phases literally share `runStandardPhase` in
`src/game/engine/simulateGame.ts`. Their main differences are chaos probability,
card eligibility, and target count. Final Five reverses the meaning of a draw,
but retains the same action and presentation. A normal elimination also expands
into spin, name reveal, result, and reaction time.

The audience repeatedly asks one question: “Whose name comes out next?” Raising
card frequency, increasing animation speed, or adding phase names will not fix
that repetition. Cards frequently interrupt progress instead of creating an
ongoing situation worth following.

## Recommended direction

The machine breaks open. The capsules become visible contestants in three short
events: survive a collapsing floor, race to an exit, then face an opponent.

Example with 48 entries: **48 → 24 → 12 → 4 → 1**.

| Act | Audience question | Persistent state | Resolution unit |
| --- | --- | --- | --- |
| Faultline | Is our sector going down? | Sector membership during a wave | Half the field together |
| Escape Run | Can my capsule catch the leaders? | Distance and occupied exit slots | Everyone moves on the same beat |
| Final Clash | Can my finalist win the next exchange? | Matchup and score | Both opponents reveal together |

The opening is intentionally a fast group cull. On its own, that would only be a
larger draw. The race and scored duels are essential: they change what the
audience follows and how outcomes develop over time.

## Act 1 — Faultline

All entrants appear on four sectors of the machine floor. Every name is present
before any elimination. Random sector assignment is locked by the seed.

Each wave has three clear beats:

1. Capsules settle into sectors. Everyone can find their group.
2. Two sectors visibly fracture. A short warning lets the audience react.
3. Both sectors collapse together. The board retains the affected names briefly,
   and the survivor count settles once. No individual elimination screens.

The survivors redistribute before the next wave. In the 48-player example, two
waves produce 48 → 24 → 12. This creates temporary shared stakes without making
teams permanent.

Initial size rule: two waves for 24 or more entrants, one for 12–23, and skip this
act for 8–11. Distribute players as evenly as possible over the four sectors and
select two distinct sectors uniformly each wave. Odd starting counts can produce
slightly different survivor counts; accept them. Do not quietly eliminate extra
players to hit a fixed threshold. The race accepts the actual survivors.

No rescue cards in the first prototype. Establish a readable baseline before
adding interruptions. A floor animation must agree with the actual sector result.

## Act 2 — Escape Run

Survivors race simultaneously toward **four exit slots**. All begin at zero.
No names leave the machine one at a time. The stage becomes a visible race board
with a finish line and occupied exit slots.

Prototype rules:

- Each capsule receives an independently shuffled copy of the same movement deck:
  **1, 1, 2, 2, 3, 3**. These are automatic moves, not player decisions.
- Reveal one movement value per racer on each shared beat. Apply all movement
  simultaneously. Keep the previous distance and leaders visible between beats.
- The finish line is at distance **9**. The first four finishers advance.
- For racers crossing during the same beat, order by the fraction of that move
  needed to reach the line: `(9 - previousDistance) / movement`. An exact tie uses
  a seed-locked, unbiased photo-finish order. Show this as a photo finish and log it.
- Once four places are occupied, resolve the remaining racers together. All
  racers have enough total movement to finish within six beats; there is no
  unbounded loop or hidden rescue rule.

Movement values are identical in inventory, but their order creates different
trajectories: early leaders, steady runners, and late bursts. Do not force a
comeback, secretly slow a leader, or animate an overtake absent from the simulation.

Example commentary becomes “Nova needs two; Flux just made a three-step burst;
there is only one slot left.” That is an evolving situation the audience can
follow before it resolves.

Render movement as bursts, then leave enough time to read the new positions.
For larger fields, use a compact race board with stable name placement and clear
distance marks. Avoid rapidly reordering a text leaderboard after every frame.

## Act 3 — Final Clash

Four qualifiers enter two simultaneous semifinal matches. The two winners face
each other in a final. Every match is first to two points.

There are three moves with one visible relationship each:

- **Pulse** beats Hack.
- **Hack** beats Barrier.
- **Barrier** beats Pulse.

For each exchange, shuffle these three moves and deal two distinct moves, one to
each opponent. Both reveal together. Resolve the printed relationship and add
one point. This has six equally likely ordered deals, no tied exchanges, and
equal treatment of both seats. Each match takes two or three exchanges.

The semifinal matches run in parallel. If one ends early, its winner remains
visible while the other finishes. The final gets more reaction time and larger
names. It ends immediately when someone earns their second point.

These are automatically dealt chaos moves, not strategic choices made by the
entrants. Presentation must not invent human decisions or imply that spectators
need to submit moves. Introducing genuine player choices would be a separate
product change requiring an input channel and response deadlines.

No fake official winner, post-victory reversal, or return to a capsule draw after
the winning point. A near win can create suspense honestly: a finalist leads
1–0, loses the next exchange, and reaches a deciding 1–1 exchange.

## What happens to chaos cards?

Retire the generic “selected player survives instead” interruption as the main
source of excitement. First test the three core mechanics without modifier cards.

If variety is still needed, introduce at most one announced modifier per act,
with its rule and eligibility fixed before the show starts. Examples to explore
later include a sector conveyor shift or one race beat that reverses movement
order. These require separate balance work; they are not rules in this proposal
or the concept demonstration.

Do not carry shields, extra lives, or race distance into the final. Each act has
one legible state model. Qualification earns a place in the next act.

## Pacing and presentation

Design targets, not measured runtimes:

| Segment | Normal-speed target |
| --- | --- |
| Lock, capsule spill, locate names | 15–20 seconds |
| Faultline, including both waves | 45–60 seconds |
| Escape Run | 60–90 seconds |
| Parallel semifinals and final | 90–120 seconds |
| Transitions and winner | 20–30 seconds |

Total target: roughly **4–6 minutes**, excluding host pauses. Tune downward if
reaction holds feel padded. Early beats affect many entrants; later beats spend
more time on identifiable finalists. Keep the host's existing start, pause,
skip-animation, phase advance, and automatic playback workflow.

The primary stage must change with the act: floor → racecourse → matchups. A
central machine dispensing one capsule must not remain the main view throughout.
Always show the current objective, who is eligible, and what changed this beat.

## Engine and migration implications

This is a rules redesign, not a change to `chaosChance` or timeline durations.

- Give each act a separate pure simulation function and state model.
- Use atomic group events for floor collapse, race movement, qualification, and
  clash exchanges. Presentation must not expand them back into serial draws.
- Seed and precompute assignments, movement decks, crossing ties, bracket
  assignment, and move deals before playback. Record the inputs and resolved
  outcomes in the audit.
- Preserve roster locking, commitment, deterministic replay, pause/resume,
  persistence, and outcome-independent presentation controls.
- Introduce a new engine rules version and compatible timeline/persistence
  schemas. Preserve existing locked sessions under their original rules or
  reject them explicitly; never reinterpret an in-progress giveaway.
- Randomness must not depend on name, input order as a priority, animation time,
  or host actions. Check exchangeability, unequal sector sizes, tie handling,
  and seat assignment. Reproducibility alone does not establish equal odds.

## What to test before rebuilding the production show

Use the concept to evaluate these specific questions:

1. Can spectators explain each act's objective after its opening sentence?
2. Can they locate their name and follow the next consequential beat?
3. Does the race produce readable position changes without becoming visual noise?
4. Do two concurrent semifinals remain readable on a shared screen?
5. Does the final feel resolved at the winning point, without another reveal?

Then implement and run multi-seed simulations for all supported roster sizes,
exactly one winner, finite event bounds, replay and refresh recovery, atomic
snapshots, probability symmetry, photo finishes, and correct score resolution.
Playtest pacing separately. The current automated tests validate the existing
rules; passing them would not validate this proposed experience.
