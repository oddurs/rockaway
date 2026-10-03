---
id: 98
uid: d0b12e4c-f353-4241-8693-f27ad52062ef
title: StatusBar
type: component
status: backlog
milestone: primitives
depends_on:
- 117
- 118
- 132
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: components
effort: m
---

## Purpose

The bar every TUI has: mode, context, position, and what the keys do. One row,
at the bottom of a screen. It is also where a transient message goes ("Copied
as ANSI"), because a TUI has a message line, not toasts. Not a toolbar of
controls, and not navigation.

## Anatomy

`<StatusBar>` with `<StatusBar.Segment priority align>` and
`<StatusBar.Message>`. Segments sit start, centre or end; a mode segment is
reverse video; KeyHints (0099) go in a segment of their own.

## States

`data-active` on a segment, `data-truncated` when a segment has been cut.

## Tokens consumed

`bg.subtle`, `fg.default`, `fg.muted`, `bg.inverse`, `fg.on-inverse`.

## Accessibility

A `footer`-level region whose message slot is `role="status"`, announced
politely and once. Segments are not live regions, so a changing position is
not read on every change.

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
- [ ] Segments that truncate by priority when the screen narrows, never wrap
- [ ] Reverse video for the active segment, with the contrast gate applied both ways
- [ ] Announced as a status region, not read on every change
- [ ] A message shows for a few seconds, is announced once, and is replaced, not stacked, by the next
- [ ] Exactly one row at every density and every width down to 40 cells

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
