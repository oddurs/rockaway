---
id: 34
uid: 7b8c9403-b317-424a-9871-6c665fdf99d8
title: Popover
type: component
status: backlog
milestone: primitives
depends_on:
- 128
created: 2026-09-22
updated: 2026-10-03
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
- [ ] Lands on whole cells relative to its trigger's screen, at every density, checked by conformance with offsets
- [ ] Flips to the other side in whole cells when it would leave the viewport, and never covers its trigger
- [ ] Its minimum width is its trigger's width, in cells, so Select can use it unchanged

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
