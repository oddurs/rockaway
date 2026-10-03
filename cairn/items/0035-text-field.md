---
id: 35
uid: f8a9f69d-752c-41ef-b10a-28a0f8da41ca
title: Text field
type: component
status: backlog
milestone: primitives
depends_on:
- 127
- 129
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: components
effort: m
---

## Purpose

Free text on one row, or several: a name, a path, a commit message. The
terminal form field, which the reader already knows how to use. Not for
choosing from a known set (Select, Combobox), and not a code editor.

## Anatomy

`<TextField label description errorMessage cols>` on React Aria's `TextField`,
built from the field parts (0127).

- `md` (default): one row. Label inline at the start, then the input as a run
  of exactly `cols` cells on `bg.subtle`, between the control delimiters:
  `Name  [hello               ]`.
- `lg`: three rows. A frame drawn by the engine with the label set into its
  top edge: `┌ Name ──────────┐`. The frame goes heavy on focus (0118).
- `multiline`: React Aria's `TextArea`, `rows` tall, scrolling whole rows.

The caret is a block where the browser supports `caret-shape: block`, and the
default bar elsewhere.

## States

`data-focused`, `data-focus-visible`, `data-invalid`, `data-disabled`,
`data-readonly`, `data-required`, `data-empty`, `data-size`.

## Tokens consumed

`bg.subtle`, `fg.default`, `fg.muted` (placeholder), `border.control`,
`border.focus`, `border.danger`, `fg.danger`.

## Accessibility

Native `input` / `textarea` with React Aria's labelling: the label names it,
description and error are linked by `aria-describedby`, `aria-invalid` and
`aria-required` are set. Delimiters and frame are `aria-hidden`. Keyboard is
the platform's own; nothing is intercepted.

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
- [ ] The input box is exactly `cols` cells wide and one row tall (`md`) or three (`lg`), at every density
- [ ] Text longer than the box scrolls inside it by whole cells, and the box never grows
- [ ] `multiline` scrolls whole rows and never shows half a line
- [ ] Placeholder, read-only and disabled are distinguishable in greyscale

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
