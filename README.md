# Capsule Chaos

A deterministic, browser-only giveaway experience designed for live screen sharing.

## Development

Requires a current Node.js release and a package manager compatible with `package.json` scripts.

```sh
pnpm install
pnpm dev
```

The app opens on `/setup`. Start Giveaway locks the roster, seed, configuration, and
full simulation, then autoplays The Purge on `/game`.

## Implemented through build steps 6–8

- CSS gachapon machine, capsule tumble/drop/open, and dynamic name reveal.
- Fast / Normal / Cinematic profiles, a presentation clock, pause after the current
  animation, resume, and skip to the current event's resolved state.
- Six deterministic Phase 1 cards: Shield, Second Life, Double Trouble, Revive,
  Reverse, and Lucky Escape. Weighted card opportunities follow five completed
  eliminations; rescues cannot generate repeated card loops. Double Trouble needs
  room for all three elimination checks above the target. Revive respects the
  per-player cap. Reverse marks the next standard draw, which still checks protection.
- Resolved timeline survivor count and a Phase I completion screen. A 50-player
  game stops at 20; smaller rosters use the existing adaptive engine targets.
- Shared Common / Rare / Epic / Legendary card frames and reveal choreography,
  generic unknown-key fallback, dynamic text, reduced-motion support, and central
  audio cue hooks (silent until audio assets/adapters are integrated).

Next Phase, or automatic phase advance, reaches a Phase II handoff screen. Later
phase playback, the other ten cards, winner/audit UI, refresh recovery, production
assets, and full live-control polish remain for their assigned build steps.
In-memory playback survives navigating between Setup and Stage; browser refresh
recovery is not implemented yet.

Engine rules are now `capsule-chaos-engine-v2-purge`. Lock schema v2 includes that
rules version in the commitment; timeline schema v2 adds resolved card metadata and
marked draws. The PRNG algorithm is unchanged. Older baseline commitments are not
compatible with the new rules and must not be treated as v2 replays.

## Quality checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The UI renders inside a fixed 1920×1080 logical stage that scales uniformly to the browser viewport.
Ultrawide and taller viewports are letterboxed so the stage is never stretched.
