---
id: 211
uid: 1cf34716-2f27-434e-949d-018574b161a8
title: List rows stay on the grid at dense after keyboard navigation
type: bug
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 133
created: 2026-10-03
updated: 2026-10-04
priority: p2
layer: components
effort: s
---

## What happens

In List's Disabled story at `dense`, after keyboard navigation, rows sit at
y = 15, 31 and 47px in 16px cells. It shows only once Screen remeasures (0199).
QA carries it as the known entry `list-dense-offset`.

## Acceptance criteria

- [x] Rows land on whole cells at every density after keyboard navigation
- [ ] The `list-dense-offset` known entry is removed

## 2026-10-03

Cause: not scroll-into-view rounding. At dense the line box (16px) is shorter than the font's ascent and descent, and the cursor mark's text ran past its row; text overflow counts as the list box's scrollable overflow, so three rows in a box of three had one pixel to scroll (scrollHeight 49, clientHeight 48), and bringing the last row into view scrolled it: rows at 15, 31, 47. Mandatory snap could not help; there was no whole row to snap to. Fix: overflow: clip on .rk-list-item and .rk-list-empty (clips without making a scroll container). Story 'Dense, moved by the keyboard' (a list that fits and one that scrolls, at dense, four arrows down) requires only whole rows to scroll, scrollTop on a row and every row on the grid; it fails without the clip (Fits: 1px to scroll). On #144's branch with the clip, List passes through the matrix with list-dense-offset removed. On #150 (feat/list-virtual) the story passes without the clip, because the virtualiser sizes the scrolled content itself; the clip is harmless there and merges cleanly. Criterion 2 waits for #144, which carries the entry: whichever of it and this lands second removes it.

## 2026-10-04

Checked the clip cuts no mark at dense: for the middle rows of a multi-select list (default and ASCII glyphs), each row with the cursor, selected and not, was captured alone (other rows hidden) with overflow: clip and with overflow: visible, counting ink outside the row's box. The counts are identical either way: 0 without the cursor, and with it only the focus ring's outline (732 and 740 pixels), which a row's own clip does not touch. So no ink of the cursor (▸/>), the check (✓/x) or the label reaches past a row at dense, and the clip removes nothing visible.
