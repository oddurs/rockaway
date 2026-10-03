---
id: 130
uid: a13961af-c9cf-4873-8768-059b43bf76c8
title: Polish Divider against the contract and the cell renderer
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

Divider shipped in 0097 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- Labelled rules exist but are only snapshotted at `start` alignment.
- Its open ends (`╶──╴`) come from the font; under 0117 they must be half
  strokes drawn by the cell, and the continuity check has to cover them.
- 0097 ticked "operable by keyboard alone" as vacuous; the metadata should say
  so rather than leave a reader to infer it.

## Acceptance criteria

- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [ ] Both painters render it identically: a test asserts it for every variant, not only the default
- [ ] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [ ] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [ ] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [ ] Metadata written to the schema (0047), and validated by its test
- [ ] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [ ] The body of 0097 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [ ] Open ends, joined ends and labelled rules at every alignment pass continuity
