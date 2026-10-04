---
id: 246
uid: f2db7e88-f354-40f8-a588-281ced175f03
title: Remeasure a screen given explicit cols and rows when its context changes
type: bug
status: review
milestone: grid
assignee: Oddur Sigurdsson
claimed: 2026-10-03
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: grid
effort: m
---

## Purpose

0199 remeasures measured screens when density, mode or font size change; a screen given cols and rows keeps its first cell size. Until then an open popover is placed exactly only at the density its trigger's screen first measured in. Found by the fields engineer in 0128.

## 2026-10-03

Fixed by #144 (0199) itself: its probe, a 1ch x 1lh span inside the screen that the ResizeObserver also watches, resizes when the density changes even when the screen's own box is sized from cols and rows, so remeasure runs and --rk-cell-* follow. Proof: Overlay 'Densities' asserts, at dense, airy, touch and normal switched at the root while a popover is open, that the trigger is one row tall in its screen's cell and the popover is exactly on the next row from the trigger's column (only the row at touch, where it is a sheet). With #144 and #149 merged it passes in storybook and p3; with #149 alone it fails (a 32px trigger in a stale 24px cell). Nothing else needed.
