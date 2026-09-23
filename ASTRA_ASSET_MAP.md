# Astra asset handoff map

All files are optional at runtime. Missing images fall back to the existing CSS presentation, missing effects are omitted, and missing or blocked audio stays silent. Asset load state never changes gameplay or timeline advancement. Replace files under `public/assets` or edit only `src/assets/manifest.ts`; engine and timeline code require no changes.

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
