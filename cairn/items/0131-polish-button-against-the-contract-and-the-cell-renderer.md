---
id: 131
uid: 7686734b-04b5-4ae5-a204-ddd8ee997428
title: Polish Button against the contract and the cell renderer
type: chore
status: backlog
milestone: primitives
depends_on:
- 32
- 47
- 117
- 118
- 119
- 132
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: m
---

## Problem

Button shipped in 0033 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- `size="lg"` is documented as "three rows, with a border drawn around the
  label", and no border is drawn: the CSS sets a minimum height and nothing
  else. Draw the frame through the engine or remove the size.
- `danger` is documented as carrying "a mark as well as a colour" and carries
  only a colour, which breaks rule 9. 0118 gives it `!`.
- `aria-keyshortcuts` is computed with `platform: 'auto'` resolved to `other`,
  always, while the visible KeyHint detects the platform after mount: on a Mac
  the button shows `⌘S` and announces `Control+S`.
- There is no text snapshot of a button anywhere: 0033's criterion was ticked
  on the strength of the delimiter assertions.
- 0033's "Metadata written" was ticked, and no metadata exists.
- The delimiters are a prop of string literals; 0119 makes them a glyph token.
- Variants are hand-written unions; adopt the variant helper (0032).

## Acceptance criteria

- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [ ] Both painters render it identically: a test asserts it for every variant, not only the default
- [ ] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [ ] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [ ] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [ ] Metadata written to the schema (0047), and validated by its test
- [ ] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [ ] The body of 0033 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [ ] `size="lg"` draws its frame through the engine, or is removed with a changeset
- [ ] `danger` carries its mark, and a greyscale screenshot story shows it
- [ ] `aria-keyshortcuts` and the visible hint agree on every platform, through one shared platform hook with KeyHint
- [ ] Variants come from the variant helper (0032)
- [ ] `quiet` is decided: either a variant that drops its delimiters and padding (and the one declared geometry exception is justified in 0118's terms), or `delimiters="none"` with padding that follows the delimiters and no exception left
- [ ] The 'On the grid' story's buttons sit on a content row, not on the frame's divider row where they hide it
