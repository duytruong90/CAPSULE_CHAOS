# Production readiness

- Build with `pnpm build`; deploy the generated `dist/` directory as static files.
- The router uses browser history. Configure the host to rewrite unknown paths such as `/setup` and `/game` to `index.html` (or navigate from the root when rewrites are unavailable).
- Primary presentation target is a Chromium, Firefox, or Safari desktop browser at 1920×1080 or 2560×1440. The logical 16:9 stage letterboxes smaller and ultrawide viewports without stretching.
- Put production media under `public/assets` using `ASTRA_ASSET_MAP.md`. Prefer compressed WebP, SVG, transparent WebM, and OGG. Keep critical startup media small enough to preload quickly; the preloader times out and the CSS fallback remains usable.
- Missing assets, blocked autoplay, storage failures, reduced motion, mute, speed changes, pause, skip, and refresh recovery do not change the locked engine outcome.
- Static hosting is single-device V1. Remote phone control and cross-device recovery require a backend and remain post-V1.
- Browser performance should be checked with production media installed. Placeholder/CSS scenes avoid large textures, survivor lookups are memoized, and large animation regions use layout/paint containment.
