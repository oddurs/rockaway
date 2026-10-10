---
id: 43
uid: 97c2c8e2-ca0c-402e-90d2-774c5627aed6
title: Tooltip
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 34
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: s
---

## Purpose

A one-line hint on hover or focus: what an icon-only control does, the full
text of a truncated label. Never the only place information lives, because a
touch reader never sees it. Not for interactive content (Popover).

## Anatomy

`<TooltipTrigger>` and `<Tooltip>` on React Aria, on the overlay contract
(0128): one row of reverse video, or a frame when it wraps, at most 40 cells
wide, positioned on whole cells next to its trigger.

## States

`data-placement`, `data-open`.

## Tokens consumed

`bg.inverse`, `fg.on-inverse`.

## Accessibility

React Aria's tooltip: shown on hover after a delay and immediately on keyboard
focus, linked by `aria-describedby`, dismissed by Escape. Not shown on touch;
the metadata says so, and a story asserts that the same information is
reachable without it.

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
- [x] Wraps to at most 40 cells and stays on whole cells
- [x] Keyboard focus shows it, Escape hides it, and focus does not move

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built on a third kind in the overlay contract, OverlayTooltip (React Aria's Tooltip with offset 0 and containerPadding 0, contexts and painter across the portal, snapped to the trigger's screen, never a sheet). The surface is one row of reverse video (Attr.reverse in the buffer; the screen's ground bg.inverse and its words fg.on-inverse, forced-color-adjust none so the swap survives forced colors) when its words fit, and framed heavy when they wrap. The words wrap at 36 cells in both shapes, so the shape never changes what it holds and the tooltip is at most 40 cells. Placement is React Aria's (top, centred); data-placement is React Aria's; open is presence, as a closed tooltip renders nothing, so there is no data-open. The metadata fixture renders it closed: a server renders no tooltip, so role=tooltip is asserted by the stories, not the metadata check. Depends on 0034 (Popover) on paper only: it uses the contract, not Popover.

## Result

Tooltip in @rockaway/react, on OverlayTooltip: put it in React Aria's TooltipTrigger; one row of reverse video, or framed heavy when its words wrap at 36 cells, at most 40 wide, never a sheet; placement top, centred, on whole cells; never shown on touch.
