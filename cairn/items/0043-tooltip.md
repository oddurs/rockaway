---
id: 43
uid: 97c2c8e2-ca0c-402e-90d2-774c5627aed6
title: Tooltip
type: component
status: backlog
milestone: primitives
depends_on:
- 34
created: 2026-09-22
updated: 2026-10-03
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

- [ ] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [ ] Styled from `data-*` state and semantic tokens only
- [ ] Stories cover every state, and run as Vitest browser tests
- [ ] axe passes; keyboard walkthrough recorded in the story
- [ ] Light, dark and forced-colors verified
- [ ] Metadata written: props, anatomy, when to use, when not to
- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Both painters render it identically, measured in cells
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
- [ ] Draws every state from the state vocabulary (0118), and no state changes its size in cells
- [ ] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal in its source
- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities
- [ ] One export line in `packages/react/src/index.ts` and one import line in `packages/css/src/index.css`, as 0122 sets out
- [ ] Wraps to at most 40 cells and stays on whole cells
- [ ] Keyboard focus shows it, Escape hides it, and focus does not move

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
