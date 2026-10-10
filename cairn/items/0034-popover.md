---
id: 34
uid: 7b8c9403-b317-424a-9871-6c665fdf99d8
title: Popover
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 128
created: 2026-09-22
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: components
effort: m
---

## Purpose

A framed box anchored to a trigger, for content that belongs to it: a filter
form, a colour picker, help for a field. The base that Menu, Select, Tooltip
and Combobox sit in. Not modal (Dialog), and not for something the reader must
act on before continuing.

## Anatomy

`<Popover placement>` inside a React Aria `DialogTrigger` (or a component's own
trigger), built on the overlay contract (0128): its own `Screen`, framed in the
non-modal border set, positioned in whole cells by `useCellPosition`, inside
the `OverlayLayer`.

## States

`data-placement` (`top`, `bottom`, `start`, `end`), `data-trigger` (which component opened it).

## Tokens consumed

`bg.surface`, `fg.default`, `border.default`; the overlay border set from the theme.

## Accessibility

React Aria's popover: a `dialog` when it holds interactive content, focus moves
in on open and back to the trigger on close, Escape and an outside press
dismiss. The frame is `aria-hidden`.

## Acceptance criteria

- [x] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [x] Styled from `data-*` state and semantic tokens only
- [x] Stories cover every state, and run as Vitest browser tests
- [x] axe passes; keyboard walkthrough recorded in the story
- [x] Light, dark and forced-colors verified
- [x] Metadata written: props, anatomy, when to use, when not to
- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [x] Both painters render it identically, measured in cells
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [x] Conforms at `strict`, or declares its exception with a reason
- [x] Draws every state from the state vocabulary (0118), and no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal in its source
- [x] Rendered by the cell renderer (0117): continuity passes at all four densities
- [x] One export line in `packages/react/src/index.ts` and one import line in `packages/css/src/index.css`, as 0122 sets out
- [x] Lands on whole cells relative to its trigger's screen, at every density, checked by conformance with offsets
- [x] Flips to the other side in whole cells when it would leave the viewport, and never covers its trigger
- [x] Its minimum width is its trigger's width, in cells, so Select can use it unchanged

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Claimed past the 0128 dependency on purpose: 0128 is in review as #149, and this branch is stacked on feat/overlay-contract by the CTO's routing, so it lands after it.

## 2026-10-03

Popover is OverlayPopover with a popover's promises: minCols (default 'trigger') and no pixel props. The trigger width is React Aria's --trigger-width, rounded up to whole cells in the surface screen's own measured cell, less half a pixel first: a Button on the grid measures 183.047px for 19 cells of 9.633px, because layout rounds each part to 1/64px, and a plain round(up) cost it a whole cell.

## 2026-10-03

data-placement and data-trigger are React Aria's, on the popover element. data-placement is the physical side React Aria reports (top, bottom, left, right), not start/end as the item first said; nothing styles on it, and the metadata test would refuse a selector on an attribute that is neither a state nor a variant.

## 2026-10-03

Found in #149: useCellSnap's translate leaves a sub-pixel transform whenever React Aria's whole-pixel left/top is off the cell grid, and a transformed layer is not pixel-snapped, so the frame's strokes break (checkContinuity: gap between ┏ and ━). Side placements show it. Setting position: relative; left/top instead passes at the identical final position. Reported to fields for #149; the End and Start stories fail until it lands.

## 2026-10-03

#149 took everything Popover needed: minCols on the surface (Popover passes 'trigger' by default, so it has no stylesheet of its own, like Frame and Divider; 0122's barrel test is per stylesheet), the painter inherited from the trigger's screen (the Rule painter story: same cells, same text), frame lines in border.default, and the snap as a laid-out offset (End and Start pass).

## 2026-10-03

Criterion 18 is checked by the stories, not by checkConformance itself: checkConformance measures each screen from its own origin, and an overlay's screen is not inside its trigger's, so it cannot see the offset between them. The Dense/Normal/Airy/Touch stories render at their density from the start and assert, in whole cells of the trigger's screen, the popover's corner and size (placeOf fails on any fraction over half a pixel), and conformance plus continuity run on each after the story. A follow-up could teach checkConformance to hold overlay surfaces to their anchor's grid.

## 2026-10-10

On main since #181; every criterion ticked. Closed from review.
