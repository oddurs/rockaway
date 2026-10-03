---
'@rockaway/react': minor
---

Breaking: `checkConformance` now holds each screen to its conformance level, and refuses `data-rk-offgrid` without a reason. The level is read from `data-rk-conformance` on the screen or an ancestor, then the theme's `--rk-conformance` token, then `standard`: `strict` allows only the glyph painter, `standard` allows half a cell inside a `[data-rk-control]`, and `loose` checks only screens and `[data-rk-pane]` boxes. An empty or whitespace-only reason, and a level that does not exist, are violations of their own. `Violation` is now a union discriminated by `what` (`width`, `height`, `x`, `y`, `painter`, `reason` or `level`), every violation names the level it was checked at, and the report adds `levels` and `reasons`, the exceptions grouped and counted by reason, so a page can say "3 exceptions declared, 2 reasons".
