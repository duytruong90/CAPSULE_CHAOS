# Capsule Chaos

A deterministic, browser-only giveaway experience designed for live screen sharing.

CAPSULE CHAOS V1 is complete through all 18 planned build steps. It accepts a
host-provided roster, locks the giveaway before playback, runs the complete show
from The Purge through the official winner, and exposes the seed and audit record
afterward.

## Development

Requires a current Node.js release and pnpm.

```sh
pnpm install
pnpm dev
```

The app opens on `/setup`. Starting a giveaway validates and locks the roster,
configuration, secure seed, commitment, complete simulation, and render-only
timeline before navigating to `/game`.

## V1 implementation

- Complete Phase 0 opening and Phase 1–5 progression, including The Purge, Chaos
  Awakens, Survival, Final Five rule reversal, Final Fate, final-two fake-outs, and
  one clearly identified official winner.
- Deterministic, UI-independent game engine with convergence safeguards, an event
  cap, reproducible timelines, and no production winner override or reroll control.
- All 16 V1 Chaos Cards with eligibility checks, safe fallbacks, protection,
  revival, target-selection, and late-phase behavior.
- Seed commitment, post-game seed reveal, verification, audit log, and JSON export.
- Fast, Normal, and Cinematic timing profiles with pause, resume, skip, manual or
  automatic phase advance, mute, fullscreen Show Mode, and emergency reset.
- Local session persistence and refresh recovery, including recovery during final
  fake-outs without changing the locked outcome.
- Responsive fixed 1920×1080 presentation stage with letterboxing, reduced-motion
  handling, survivor status, phase boundaries, and official-winner presentation.

## Production media

The Priority 1–3 media pack is installed under `public/assets`. It contains 73
assets totaling approximately 1.36 MB:

- two WebP arena backgrounds;
- 53 SVG machine, capsule, card, icon, and effect assets;
- 18 original WAV sound cues.

The typed asset manifest, preloader, transparent/CSS fallbacks, global mute, and
timeline-controlled effects keep presentation failures separate from gameplay.
Run `pnpm assets:build` to regenerate the vector artwork, audio, and development
preview. See [ASTRA_ASSET_MAP.md](ASTRA_ASSET_MAP.md) for the integration contract
and [docs/MEDIA_PROVENANCE.md](docs/MEDIA_PROVENANCE.md) for generation provenance.

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

Automated tests cover deterministic simulations, all cards and phases, commitment
verification, recovery, playback controls, winner presentation, and the complete
media inventory. Manual QA for the finished V1 has also been completed successfully.

## Production deployment

`pnpm build` creates the static site in `dist/`. Configure the host to rewrite
unknown browser-history routes, including `/setup` and `/game`, to `index.html`.
See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for deployment notes.

Remote phone control and cross-device recovery require a backend and remain
optional post-V1 work.
