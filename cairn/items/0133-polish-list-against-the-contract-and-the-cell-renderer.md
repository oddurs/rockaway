---
id: 133
uid: 3a7889fb-5909-44f1-b1b7-50056f1eb839
title: Polish List against the contract and the cell renderer
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
effort: m
---

## Problem

List shipped in 0100 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- Focus and selection are drawn identically (reverse video for both), so in a
  multi-select list the cursor is invisible. 0118 separates them.
- `▸`, `░` and `█` are literals in the component.
- The row height starts as a hard-coded 20px until the first measurement.
- There is a snapshot of the scrollbar and none of a list.
- Disabled rows only dim; empty collections render nothing at all.
- At touch density, a scrolled list must still land on whole rows.

## Acceptance criteria

- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [ ] Both painters render it identically: a test asserts it for every variant, not only the default
- [ ] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [ ] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [ ] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [ ] Metadata written to the schema (0047), and validated by its test
- [ ] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [ ] The body of 0100 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [ ] Focus and selection are distinguishable in a multi-select list, in a snapshot and in forced colors
- [ ] An empty list draws an empty state, through React Aria's `renderEmptyState`
- [ ] No hard-coded pixel value is left in the component
- [ ] A pure `listBuffer` draws the whole List (rows, cursor cell, scrollbar) and `ListItem` renders from it, so List's snapshot is the component and not only its scrollbar
- [ ] List counts its rows from the collection, not from one `scrollHeight` read taken before React Aria renders it; stories that pass `total` only for this stop passing it
