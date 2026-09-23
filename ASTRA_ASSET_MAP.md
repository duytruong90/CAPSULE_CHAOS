# Astra asset handoff map

The first original media pack is installed in `public/assets`: **73 files, approximately 1.36 MB**. It covers all three priorities in planner Section 45. Backgrounds were created with the built-in image-generation tool; layered vector artwork extends the existing code-native presentation; sound effects are original synthesized tones. This is a project-created pack following the Astra brief, not externally supplied Astra files.

Run `pnpm dev` and open `/docs/media-preview.html` for the complete visual gallery and playable audio samples. `pnpm assets:build` reproducibly rebuilds vector/audio files and the gallery; it preserves the two generated backgrounds. The gallery is a development artifact and is not bundled by the production Vite entry point.

Missing images retain safe CSS fallbacks, missing effects become transparent, and missing/blocked audio stays silent. Asset failures never affect gameplay or timeline advancement. The typed manifest supports Vite's base URL. Change files or manifest paths to replace media without modifying the engine or timeline.

## Installed formats and integration

| Category   | Installed files                                                                | Use                                                                                          |
| ---------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Background | `bg_arena_main.webp`, `bg_arena_final.webp`                                    | Main show and Final Five onward; 1672×941, near-16:9, cover-fit, 170 KB combined             |
| Machine    | `gachapon_base.svg`, `gachapon_glass.svg`, `gachapon_chute.svg`                | Registered 470×650 layers, with live capsules behind the transparent glass                   |
| Capsules   | `capsule_red.svg`, `capsule_blue.svg`, `capsule_green.svg`, `capsule_gold.svg` | 180×180, transparent; clipped halves preserve existing opening animation                     |
| Cards      | `card_back.svg`, four `card_<rarity>_frame.svg`, `winner_frame.svg`            | 760×640 card frames; 1120×610 winner border; text remains in React                           |
| Icons      | 16 card icons plus `icon_crown.svg`                                            | 128×128; all V1 cards, survivor protection badges, official winner                           |
| Audio      | 18 `sfx_*.wav`                                                                 | 24 kHz mono PCM, 0.3–3.4 seconds; all cues are original, peak-limited, and browser-decodable |

All SVGs have true transparency and no embedded timers, scripts, fonts, external references, or baked-in player/rule text. WAV was selected for this compact first pack to avoid adding an encoder dependency; OGG can replace it through the manifest. Effects are **SVG plates animated by CSS**, not WebM files. This keeps animation timing under the existing playback controller and provides reliable skip and reduced-motion behavior. The original WebM/OGG handoff below remains the contract for future cinematic replacements, not a list of missing files.

## Priority coverage

- Priority 1: both arenas, three machine layers, four capsules, card back and all rarity frames, elimination slash, shield hit, revival, winner frame, crown, confetti and victory rays.
- Priority 2: separate `fx_mirror`, `fx_chaos_bomb`, `fx_duel`, `fx_reverse`, `fx_steal`, `fx_override`, `fx_jackpot`, `fx_final_pass`, and `fx_second_life` plates and corresponding icons.
- Priority 3: particles, transition wipe, standard/scan/split glitches, smoke, lightning and ambient rays.
- Audio: spin/drop/open, card flip, elimination/safe/revival, shield/duel, heartbeat/glitch/winner, and separate rare/epic/legendary charge and impact cues. Global mute stops active audio; new timeline events dispose previous sounds; skip/unmount stop playback. Autoplay rejection remains silent.

`src/assets/showAssets.ts` maps resolved timeline events to effects. `EventEffects.module.css` handles reveal/fade, wipe, glitch, smoke and confetti movement. Effects do not loop indefinitely, settle cleanly on skip, and are hidden under reduced motion. Decorative media never drives event completion.

## Future cinematic handoff

| Logical ID                                                     | Expected path                       | Purpose / use                           | Recommended canvas | Loop     | Alpha |
| -------------------------------------------------------------- | ----------------------------------- | --------------------------------------- | ------------------ | -------- | ----- |
| `bg_arena_main`                                                | `background/bg_arena_main.webp`     | Main arena, Phases 1–3                  | 1920×1080          | No       | No    |
| `bg_arena_final`                                               | `background/bg_arena_final.webp`    | Final Five through winner               | 1920×1080          | No       | No    |
| `gachapon_base`, `gachapon_glass`, `gachapon_chute`            | `machine/<id>.webp`                 | Layered machine parts                   | 900×900            | No       | Yes   |
| `capsule_red`, `capsule_blue`, `capsule_green`, `capsule_gold` | `capsules/<id>.webp`                | Draw variants; gold is champion capsule | 512×512            | No       | Yes   |
| `card_back`, `card_*_frame`                                    | `cards/<id>.webp`                   | Reusable card back and rarity frames    | 720×960            | No       | Yes   |
| `fx_elimination_slash`                                         | `effects/fx_elimination_slash.webm` | Elimination impact                      | 1920×1080          | No       | Yes   |
| `fx_shield_hit`                                                | `effects/fx_shield_hit.webm`        | Shield blocks an elimination            | 1920×1080          | No       | Yes   |
| `fx_revival`                                                   | `effects/fx_revival.webm`           | Player returns from elimination         | 1920×1080          | No       | Yes   |
| `fx_reverse`                                                   | `effects/fx_reverse.webm`           | Reverse / rule-reversal effects         | 1920×1080          | No       | Yes   |
| `fx_glitch`                                                    | `effects/fx_glitch.webm`            | Final fake-out interruption             | 1920×1080          | No       | Yes   |
| `fx_legendary_burst`                                           | `effects/fx_legendary_burst.webm`   | Legendary card reveal                   | 1920×1080          | No       | Yes   |
| `fx_winner_confetti`                                           | `effects/fx_winner_confetti.webm`   | Official winner celebration             | 1920×1080          | Optional | Yes   |
| `icon_shield`, `icon_second_life`, `icon_revive`, `icon_duel`  | `icons/<id>.svg`                    | Survivor/card status icons              | 128×128            | No       | Yes   |
| `sfx_*`                                                        | `audio/<id>.ogg`                    | Centralized UI/show sound cues          | Short OGG          | No       | N/A   |

Card/action timing and visual sequence should follow Sections 20–24 and 45–46 of `CAPSULE_CHAOS_planner.md`. Do not bake player names, rule text, or result labels into assets.
