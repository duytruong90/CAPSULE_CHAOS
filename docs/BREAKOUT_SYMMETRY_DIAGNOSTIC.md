# Breakout V4 symmetry diagnostic

Run on 2026-09-23 against `capsule-chaos-engine-v4-breakout`.

This is an offline diagnostic, not a production filter or a proof. For each field
size, the run used the 20,000 distinct integers 1–20,000 encoded as 256-bit master
seeds. Every named random stream was derived through the production SHA-256 stream
namespace, and every run used the unmodified production `simulateBreakout` path.
No result was discarded, rerolled, or selected for presentation value.

| Entries |   Runs | Expected/index | Minimum | Maximum | Chi-square |
| ------: | -----: | -------------: | ------: | ------: | ---------: |
|       3 | 20,000 |       6,666.67 |   6,603 |   6,753 |     1.8031 |
|       5 | 20,000 |       4,000.00 |   3,927 |   4,062 |     2.4955 |
|      21 | 20,000 |         952.38 |     918 |   1,019 |    13.7833 |
|      33 | 20,000 |         606.06 |     545 |     676 |    44.1802 |
|      61 | 20,000 |         327.87 |     285 |     377 |    60.0391 |

The complete winner-count vectors, in original entry-index order, were:

- **N=3:** `6644, 6753, 6603`
- **N=5:** `3983, 4006, 4062, 4022, 3927`
- **N=21:** `918, 958, 971, 959, 956, 938, 967, 961, 1019, 920, 925, 999, 943, 974, 954, 945, 931, 940, 942, 962, 918`
- **N=33:** `590, 570, 655, 627, 627, 634, 612, 624, 621, 545, 629, 594, 571, 609, 605, 594, 569, 641, 594, 619, 612, 551, 676, 600, 592, 616, 573, 590, 602, 592, 601, 650, 615`
- **N=61:** `339, 346, 293, 327, 311, 323, 335, 358, 326, 331, 334, 316, 308, 310, 356, 377, 333, 334, 325, 327, 343, 356, 333, 321, 296, 318, 342, 337, 329, 320, 309, 341, 323, 300, 325, 347, 329, 340, 357, 307, 326, 348, 351, 320, 331, 313, 316, 313, 300, 285, 343, 333, 334, 312, 347, 319, 300, 350, 310, 330, 337`

## Symmetry argument

Faultline assigns entries by a uniformly shuffled order and selects hazards without
consulting names or original indices. Unequal sector sizes remain exchangeable
because every entry has the same distribution over sector positions and hazard
choices. Escape Run gives every racer the same independent movement-deck
distribution, while exact cutoff ties use a separate uniformly shuffled priority.
Final Clash uniformly assigns bracket seats and deals the same symmetric set of
ordered distinct move pairs to both sides. Variable survivor counts and seeded byes
change the route, but their random assignment does not privilege an original entry
index.

The sampled extrema and chi-square statistics did not expose structural index
asymmetry. Determinism and exhaustive move-scoring tests remain the hard pass/fail
checks; this diagnostic is retained as release evidence only.
