---
id: 35
uid: f8a9f69d-752c-41ef-b10a-28a0f8da41ca
title: Text field
type: component
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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
- [x] The input box is exactly `cols` cells wide and one row tall (`md`) or three (`lg`), at every density
- [x] Text longer than the box scrolls inside it by whole cells, and the box never grows
- [x] `multiline` scrolls whole rows and never shows half a line
- [x] Placeholder, read-only and disabled are distinguishable in greyscale
- [ ] The textarea takes `rk-scroll` (0207/0208) and shows its position in cells if it scrolls by rows; a story tagged `classic-scrollbars` proves one scrollbar only

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built on React Aria's TextField, Input and TextArea with the field contract. md: Label, then [ input ] with the input exactly --rk-text-field-cols cells on bg.subtle. lg and multiline: FieldFrame (pad 0) around a cell of air, the text, and a cell of air (lg) or the scrollbar column (multiline), so a framed box is cols + 4 wide. A box of several rows is always framed: delimiters bracket one row, and bg.subtle alone collapses to Canvas in forced colors.

## 2026-10-03

Whole-cell scrolling: the browser scrolls a field by pixels to wherever the caret needs, so useCellScroll rounds scrollLeft (one row) or scrollTop (several) to a whole cell on scroll, input, keyup, focus and select, except at either end, where rounding would fight the caret. It is scrolling, not focus or keys. The cells either side of the text show the theme's overflow marks while text is hidden that way (0207: position in cells, no native scrollbar); multiline paints List's scrollbarBuffer into a one-cell column. Read-only: no ground and blank delimiter cells, the value alone (0118's row), which also tells it apart in forced colors.

## 2026-10-03

Criterion 11 left open: keyboard alone is proven (Keyboard story), and the box is one cell tall at every density, but touch is 32px until 0197 makes the touch line box 2.75; the known-failures table carries it (touch-height). Nothing here changes when 0197 lands. Focus on a framed box is React Aria's focus-visible (keyboard), as everywhere: a click puts the caret in without making the frame heavy.

## 2026-10-03

Batch 6 added criterion 22 while this branch ticked the rest. The textarea and the input take rk-scroll (and text-field.css hides the bar itself), multiline shows its position in a drawn scrollbar column, and Overflow and Multiline are tagged classic-scrollbars, with Multiline asserting no bar takes room from the box. Left unticked until #107 lands: the classic-scrollbars browser project is in that PR, so on main the tag runs nowhere yet and the assertion is vacuous in headless Chromium.

## 2026-10-03

Criterion 11 ticked after merging 0198 (#112): touch's line box is now 2.75, so the one-row box is 44px at touch; the Touch story asserts at least 44.
