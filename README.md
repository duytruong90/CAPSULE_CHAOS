# Capsule Chaos

A deterministic, browser-only giveaway experience designed for live screen sharing.

## Development

Requires a current Node.js release and a package manager compatible with `package.json` scripts.

```sh
pnpm install
pnpm dev
```

The app opens on `/setup`; the placeholder game stage is available at `/game`.

## Quality checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The UI renders inside a fixed 1920×1080 logical stage that scales uniformly to the browser viewport.
Ultrawide and taller viewports are letterboxed so the stage is never stretched.
