---
'@rockaway/react': minor
---

`checkContinuity` now checks shapes drawn outside a painted layer. Pass them as `shapes`. Each one names the element it is drawn on, the pseudo-element if any, the character it draws as, and the cells of the element's box it fills. Its cells are read like painted ones, for gaps, leaks, steps and breaks. Without the element's own words in its screenshot, a heading's descenders are not taken for a leak in the rule below it. `proseShapes(root)` lists every shape a block of `.rk-prose` draws: the rules under `h1`, `h2` and table headers, `hr`, and a quote's gutter. The report gains an `outside` count.
