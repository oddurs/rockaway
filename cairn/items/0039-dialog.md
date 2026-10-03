---
id: 39
uid: f3445f26-c9ae-4de5-a110-eb7203bef5de
title: Dialog
type: component
status: backlog
milestone: primitives
depends_on:
- 128
- 131
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: components
effort: m
---

## Purpose

A modal window for something the reader must finish or dismiss before going
on: a confirmation, a short form, the help screen. The command palette (0102)
is one. Not for passive information (Popover), and not for long content that
deserves a page.

## Anatomy

`<Dialog title>` in a React Aria `Modal`, built on the overlay contract
(0128): the backdrop of `░` drawn in cells, the dialog centred on whole cells
in the modal border set, its title in the top edge, content, and an action row
at the bottom right of Buttons. `<AlertDialog>` is the destructive-confirmation
form (`role="alertdialog"`, the primary action is the safe one). Under 60
cells, or at touch density, it is a full-width bottom sheet.

## States

`data-entering` and `data-exiting` are not used (no motion); `data-variant` (`default`, `alert`).

## Tokens consumed

`bg.surface`, `fg.default`, `border.default`, `fg.muted` (backdrop); the modal border set from the theme.

## Accessibility

`role="dialog"` (or `alertdialog`) named by its title; focus is contained,
starts on the first focusable element (or the safe action in an alert), and
returns to the trigger; Escape closes; the page behind is inert and does not
scroll.

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
- [ ] Centred on whole cells at every density and every width from 40 to 120 cells, checked by conformance
- [ ] Becomes a bottom sheet under 60 cells and at touch density, in a story at each
- [ ] A text snapshot shows the dialog over its backdrop (through 0128's composed `screenshot()`)
- [ ] An AlertDialog focuses its safe action first

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
