---
id: 132
uid: ccc2ba10-1b40-4e4a-b1cc-f95ed0b6a160
title: Polish KeyHint against the contract
type: chore
status: backlog
milestone: primitives
depends_on:
- 47
- 118
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: s
---

## Problem

KeyHint shipped in 0099 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- Platform detection is local to KeyHint and reads the deprecated
  `navigator.platform`; Button resolves the same question differently (0131).
  One `usePlatform()` hook, preferring `navigator.userAgentData`, should answer
  it for both.
- The snapshot table of chords is good documentation and is not yet in a form
  the site can show; it becomes the component's metadata snapshot.
- KeyHint has no frame, so 0117 changes little here; the polish is mostly
  consistency.

## Acceptance criteria

- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [ ] Both painters render it identically: a test asserts it for every variant, not only the default
- [ ] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [ ] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [ ] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [ ] Metadata written to the schema (0047), and validated by its test
- [ ] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [ ] The body of 0099 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [ ] One `usePlatform()` hook, used by KeyHint and Button, with no hydration mismatch
- [ ] Under an ascii theme the key legends are ASCII too (`Cmd`, `Shift`, `Up`, `Enter`), drawn from the glyph set like every other mark
