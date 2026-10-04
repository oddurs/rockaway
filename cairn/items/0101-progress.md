---
id: 101
uid: d98b4d5a-3c78-44cc-82af-92bd2e826c5a
title: Progress
type: component
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 117
- 118
- 120
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: components
effort: s
---

## Purpose

Progress, spinner and sparkline: the three ways a terminal shows time passing.
Not a chart.

## Anatomy

`<ProgressBar>` (determinate: block eighths, `███████▍   62%`; indeterminate:
a block moving on the tick), `<Spinner>` (braille frames on the tick, with a
label), and `<Sparkline values cols>` (the eight bars, one value per cell).
`<Meter>` is ProgressBar's static sibling for a level, not a task.

## States

`data-indeterminate`, `data-complete`, and on Meter `data-tone` by threshold.

## Tokens consumed

`fg.accent` (the bar), `fg.muted` (the track), `fg.success`, `fg.warning`, `fg.danger` (Meter thresholds).

## Accessibility

`progressbar` and `meter` through React Aria, with value text ("62%"). A
spinner is a `status` with its label, and the frames are `aria-hidden`. A
sparkline is an image with a text alternative summarising the series (first,
last, minimum, maximum).

## Acceptance criteria

- [x] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [x] Styled from `data-*` state and semantic tokens only
- [x] Stories cover every state, and run as Vitest browser tests
- [x] axe passes; keyboard walkthrough recorded in the story
- [x] Light, dark and forced-colors verified
- [x] Metadata written: props, anatomy, when to use, when not to
- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Both painters render it identically, measured in cells
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
- [x] Draws every state from the state vocabulary (0118), and no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal in its source
- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities
- [x] One export line in `packages/react/src/index.ts` and one import line in `packages/css/src/index.css`, as 0122 sets out
- [x] Block glyphs for progress, braille frames for the spinner, block eighths for the sparkline
- [x] Frames advance on a tick from the motion tokens (0120), and stop entirely on reduced motion
- [x] Determinate and indeterminate both announce correctly
- [x] Partial blocks are drawn by the cell renderer (0117), so a bar is one solid run at every density
- [ ] Button's `isPending` shows the spinner in its reserved cell (with Button's polish, 0131)
- [x] The spinner is a component drawn through `shapeAttributes` (0166), not only a story

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
