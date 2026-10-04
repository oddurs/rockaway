---
'@rockaway/css': patch
---

Under forced colors, a shape drawn in reverse video, or inside something reversed, is now inked in the reversed figure, so it stays visible. Before, a box drawn with the reverse attribute vanished into its own ground. Each reversal's opt-out sets `--rk-forced-ink`, and `[data-rk-shape]` reads it. Tree's selected-row guides now use that shared rule instead of one of their own.
