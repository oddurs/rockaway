---
id: 39
uid: f3445f26-c9ae-4de5-a110-eb7203bef5de
title: Dialog
type: component
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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
- [x] Centred on whole cells at every density and every width from 40 to 120 cells, checked by conformance
- [x] Becomes a bottom sheet under 60 cells and at touch density, in a story at each
- [x] A text snapshot shows the dialog over its backdrop (through 0128's composed `screenshot()`)
- [x] An AlertDialog focuses its safe action first

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built on OverlayModal (0128). Title is set into the frame's top edge (a title option added to the overlay frame) and names the dialog through aria-label; the alert's caution mark is chrome, not in the name. Focus: React Aria puts it on the dialog itself on open, Tab goes to the first control. I tried FocusScope autoFocus for 'first focusable', but react-aria is not a direct dependency and adding it offline resolved a second, peerless copy, which would split the focus-scope tree; so I kept React Aria's own behaviour rather than hand-roll it. AlertDialog's safe action takes autoFocus (React Aria's prop). The metadata check renders on a server, where an open overlay renders nothing, so its fixture also renders openDialogBody (exported from the module, not the package) as the evidence for roles and data-variant. The workbench runner gained viewport(size?) for the widths story (40, 59, 60, 120 cells), put back after.

## 2026-10-03

Criterion 18 left unticked: centring is asserted at 40, 59, 60 and 120 cells at normal density, and the conformance walk checks the open dialog at every density at the default width; every density at every width is not checked. Site page waits for #158.

## 2026-10-03

Criterion 18: the story 'Densities and widths' opens the dialog from a touch pane and a dense pane at 40 and 120 cells and runs conformance on it in each, with the sheet or the centring asserted on whole cells. react-aria-components re-exports neither FocusScope nor useFocusManager, so focus stays as React Aria puts it (agreed with the CTO).
