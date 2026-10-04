---
id: 228
uid: d38fbf33-e1c5-4d3b-ad71-3853dc081e1f
title: Re-check cellsIn's snap at the new line boxes
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 198
created: 2026-10-03
updated: 2026-10-04
closed_at: 2026-10-04
priority: p2
layer: grid
effort: s
---

## Problem

`cellsIn` allows a 1/32px snap, chosen at the old line boxes. 0198 made them 1.5
and 2.75.

## Acceptance criteria

- [x] A test measures boxes of whole cells at every density and both axes, and the snap holds

## 2026-10-04

Decision: the grace is a sixteenth of a cell, not 1/32px, and it lives once, in cellsIn and its new dual cellsCovering (CELL_GRACE exported). Measured (Grid/Cell grace): boxes of 1 to 200 whole cells at every density and four reading sizes, across and down, as one box and as 5 and 30 boxes end to end, all read back exactly in Chromium, WebKit and Firefox; the worst was 4.4% of a cell, 70% of the grace (Chromium; WebKit 68%; Firefox 0.4%). The old 1/32px fails there: Chromium truncates each box to 1/64px, about a hundredth of a pixel lost a box. No fixed grace covers unbounded boxes: 200 one-cell boxes end 29% (Chromium) and 26% (WebKit) of a cell off, while the same row telescoped as screen.css lays out runs is exact in all three, so long rows must telescope. The overlay's trigger width now goes through cellsCovering in a layout effect instead of its own CSS round-up of 1px/32, which made Select's popover 31 cells for a trigger a few hundredths over 30; Overlay's Minimum width story holds a trigger 0.04px over 12 cells to 12. Cost, stated in cellsIn's comment: a box up to a sixteenth of a cell short of n is drawn as n, a sliver past its edge, rather than n - 1. field.css, fieldset.css and table.css already round with the same sixteenth.
