# Production readiness

- Build with `pnpm build`; deploy the generated `dist/` directory as static files.
- The router uses browser history. Configure the host to rewrite unknown paths such as `/setup` and `/game` to `index.html` (or navigate from the root when rewrites are unavailable).
- Primary presentation target is a Chromium, Firefox, or Safari desktop browser at 1920×1080 or 2560×1440. The logical 16:9 stage letterboxes smaller and ultrawide viewports without stretching.
- The original Priority 1–3 media pack is installed under `public/assets`: 73 WebP/SVG/WAV files totaling approximately 1.36 MB. See `ASTRA_ASSET_MAP.md` for integration and replacement details. The preloader times out and the CSS fallback remains usable.
- Missing assets, blocked autoplay, storage failures, reduced motion, mute, speed changes, pause, skip, and refresh recovery do not change the locked engine outcome.
- Static hosting is single-device V1. Remote phone control and cross-device recovery require a backend and remain post-V1.
- Browser layout/media loading is checked at 1080p with the installed pack. Effects use SVG plates plus compositor-friendly CSS transforms/opacity; survivor lookups are memoized. A sustained 60 FPS claim still requires measurement on the actual screen-sharing desktop/browser.
- Before release, audition the audio in an external browser: format/peak and playback-control tests pass, but the embedded preview crashed during the listening check. See `docs/MEDIA_PROVENANCE.md` for generation sources and validation limitations.
