# Capsule Chaos

A deterministic, browser-only giveaway experience designed for live screen sharing.

The production show uses the Breakout V4 contract. It accepts any positive roster
size, locks and persists the complete result before playback, routes the field
through up to three acts, and exposes a reproducible audit after the official
winner.

## Development

Requires a current Node.js release and pnpm.

```sh
pnpm install
pnpm dev
```

The app opens on `/setup`. Starting a giveaway validates and locks the roster,
configuration, secure seed, commitment, complete simulation, and render-only
timeline before navigating to `/game`.

## Breakout V4 implementation

- Faultline is a shared floor disaster for fields above 16, Escape Run is a
  simultaneous race for fields above four, and Final Clash is the scored finale.
  Smaller fields enter at the appropriate later act.
- The UI-independent engine derives eight named random streams from one secure
  master seed, precomputes every event, and produces exactly one winner without a
  production override or reroll control.
- The `capsule-chaos-lock-v4` commitment covers the roster, host configuration,
  fixed rules, engine version, PRNG and master seed. Verification recomputes all
  streams, act preparation, event history and exact timeline.
- Fast, Normal and Cinematic timing profiles include Pause, Resume, Skip, manual
  or automatic act advance, mute, a paused roster lookup and guarded emergency
  reset.
- Immutable sessions and small queued checkpoints use IndexedDB. Refresh recovery
  opens paused, verifies the complete record before enabling Resume, and reports
  storage failure without stopping the in-memory show.
- The indefinite winner view reveals the seed and commitment, verifies the whole
  show, and provides the complete audit JSON. There is no reroll action.

## Production media

The legacy media pack remains under `public/assets`, and the Breakout pack under
`public/assets/breakout` contains 43 generated SVG/WAV assets for all three acts.

The typed asset manifest, preloader, transparent/CSS fallbacks, global mute, and
timeline-controlled effects keep presentation failures separate from gameplay.
Run `pnpm assets:breakout` to regenerate the three-act pack. Older localStorage
sessions are detected and offered as an untouched JSON download; they are never
reinterpreted as Breakout sessions.

## Quality checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Automated tests cover all roster routes, deterministic act simulations, commitment
and audit tamper detection, recovery validation, playback controls, stage rendering
and the complete Breakout media inventory. The offline 20,000-seed-per-field
[symmetry diagnostic](docs/BREAKOUT_SYMMETRY_DIAGNOSTIC.md) records the release
sample and exchangeability argument.

## Production deployment

`pnpm build` creates the static site in `dist/`. Configure the host to rewrite
unknown browser-history routes, including `/setup` and `/game`, to `index.html`.
See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for deployment notes.

Remote control and cross-device recovery require a backend and are outside the
browser-only V4 contract.
