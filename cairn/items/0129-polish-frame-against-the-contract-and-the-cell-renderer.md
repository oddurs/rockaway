---
id: 129
uid: cfa8b627-4083-4f75-8a06-4f6b799f77dc
title: Polish Frame against the contract and the cell renderer
type: chore
status: backlog
milestone: primitives
depends_on:
- 47
- 117
- 118
- 119
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: s
---

## Problem

Frame shipped in 0096 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- The default border is `single` whatever the theme's `borderSet` input says;
  the theme never reaches the screen (fixed in 0119, adopted here).
- 0073 says "a heavy box may hold light dividers", but `dividers` always use
  the frame's own set. Add a divider weight.
- Both-painter parity is asserted for the default only.
- The `rounded` title truncates to `round…` in the border-set snapshot at a
  width where it would fit with one fewer padding cell; check the truncation
  rule is the one we mean.

## Acceptance criteria

- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [ ] Both painters render it identically: a test asserts it for every variant, not only the default
- [ ] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [ ] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [ ] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [ ] Metadata written to the schema (0047), and validated by its test
- [ ] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [ ] The body of 0096 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [ ] Dividers take their own border set, and a heavy frame with light dividers resolves its tees through the junction table, in a snapshot
