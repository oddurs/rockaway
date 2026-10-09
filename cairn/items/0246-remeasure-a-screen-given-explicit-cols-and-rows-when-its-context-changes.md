---
id: 246
uid: f2db7e88-f354-40f8-a588-281ced175f03
title: Remeasure a screen given explicit cols and rows when its context changes
type: bug
status: review
milestone: grid
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-03
updated: 2026-10-09
priority: p2
layer: grid
effort: m
---

## Purpose

0199 remeasures measured screens when density, mode or font size change; a screen given cols and rows keeps its first cell size. Until then an open popover is placed exactly only at the density its trigger's screen first measured in. Found by the fields engineer in 0128.

## 2026-10-09

Not fixed by #144 alone after all. With #195's snap (ties go up and left) the strict story found the rest: React Aria places again when its trigger resizes, but a trigger also moves without resizing when its screen remeasures (the density switch's second step, and a sheet giving way to a popover). React Aria's pixels then stayed where the trigger was. Fix: usePlaceOnMove in OverlayPopover watches the trigger's screen (ResizeObserver), the contexts and scroll, and when the trigger has moved holds shouldUpdatePosition false for one frame, then true, which is a dependency change React Aria places again on. Tried first: dispatching a window resize (heard by every listener in an app) and tracking the move inside useCellSnap (its effect re-ran on a sheet change and lost the previous position, so the sheet-to-popover move was missed). The Overlay 'Densities' story now asserts the popover on the row under its trigger, from its column, at dense, airy, touch (row only: a sheet) and normal; it fails on main.
