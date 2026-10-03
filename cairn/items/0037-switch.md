---
id: 37
uid: 9e39811b-f2b5-4a99-8266-66aa8584810d
title: Switch
type: component
status: backlog
milestone: primitives
depends_on:
- 119
- 127
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: components
effort: s
---

## Purpose

An on/off setting that takes effect immediately: `[──●] Wrap lines`. Not for a
choice that is submitted with a form (Checkbox).

## Anatomy

`<Switch>` on React Aria. Delimiters around a three-cell track; the thumb sits
at the start when off and the end when on, and on is also reverse video:
`[●──] Off-label`, `[──●] On-label`. The label does not change with the
state.

## States

`data-selected`, `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-readonly`.

## Tokens consumed

`fg.default`, `bg.inverse`, `fg.on-inverse`, `fg.disabled`, `border.control`.

## Accessibility

`role="switch"` with `aria-checked`, through React Aria. Space toggles. The
track and thumb are `aria-hidden`; the name is the label only.

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
- [ ] On and off differ in the thumb's position and in reverse video, and snapshot differently
- [ ] The control is the same width in both states

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
