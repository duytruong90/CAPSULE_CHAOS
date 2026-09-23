# Original media pack

Created for this repository from the planner's dark arcade/gacha brief. No third-party stock samples, branded artwork, fonts or character assets were used. Generated media should still receive the owner's visual review before public release.

## Bitmap backgrounds

Created using the **built-in image-generation tool**. The returned 1672×941 images were encoded directly to WebP at quality 84 (no compositing, recoloring or image-content edits). Delivered files:

- `public/assets/background/bg_arena_main.webp`
- `public/assets/background/bg_arena_final.webp`

Full prompt for the main arena:

> Use case: stylized-concept. Asset type: production background for CAPSULE CHAOS dark arcade gacha browser game, widescreen 16:9. Create a polished original cinematic empty game-show arena: deep ink-purple architectural chamber, glossy obsidian floor, elegant concentric neon violet and muted cyan arcs near outer edges, subtle physical haze and soft volumetric lighting. Straight-on camera. The central 65 percent must be very dark low-detail negative space for readable dynamic player names and game UI; upper and lower edges also reserved for HUD. Rich polished 3D materials, restrained esports aesthetic, no machines, no capsules, no people, absolutely no text, symbols, logos or watermark. Deliver one landscape background image, ideally 1920x1080.

Full prompt for the final chamber:

> Use case: stylized-concept. Production background for final chamber of CAPSULE CHAOS, a dark original arcade gacha browser show. Widescreen 16:9 polished cinematic 3D empty arena. Obsidian-black curved architecture, champagne-gold concentric perimeter light strips, subtle ivory beams in upper corners, restrained gold floor reflections, faint atmospheric haze. Straight-on centered symmetrical composition, central 65 percent dark empty negative space for finalists and large winner text. Top/bottom HUD must remain readable. Luxurious dramatic escalation from purple/cyan arcade arena to gold/black final chamber. No central pedestal, no objects, no capsules, no people, absolutely no text logos symbols or watermarks. One landscape image, ideally 1920x1080.

The original generation files remain in the local Codex generated-images directory. Runtime assets live entirely inside this repository. `scripts/import-backgrounds.mjs` records the encoding procedure and accepts the Sharp package path and two generated PNG paths as arguments.

## Vector artwork and audio

`scripts/build-media.mjs` is the editable source for all 53 SVG graphics and 18 WAV cues. Run `pnpm assets:build` to regenerate them. This intentionally overwrites those generated media files, so edit the source or use new manifest IDs for hand-authored replacements.

Vector art retains the established machine/card geometry for compatibility. Effects are transparent static SVG plates; the application provides their animation and timing. Original audio combines oscillators, pitched sweeps, bounded deterministic noise and attack/decay envelopes; it imports no external samples and has no gameplay RNG dependency.

The full set is listed in `docs/media-preview.html`, available at `/docs/media-preview.html` on the development server. Use its audio controls to audition individual cues. Automated format/header/peak checks, missing-file fallback and global mute tests pass. The full demo was visually checked through its verified winner screen. Audio listening verification remains pending: the embedded preview browser crashed when an audio control was used, so audition the cues in an external browser before release. No claim of professional audio mastering is made.
