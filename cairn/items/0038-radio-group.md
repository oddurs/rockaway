---
id: 38
uid: 2ee63611-333b-4b29-ae8a-d6a54ad0fb7e
title: Radio group
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

One choice out of a few, all visible at once: `● main  ○ develop`. Not for long
lists (Select), and not for independent choices (Checkbox).

## Anatomy

`<RadioGroup label orientation>` and `<Radio value>` on React Aria. A radio is
the mark cell (`●` / `○`), one cell of space, and the label. The group is a
Fieldset (0127); horizontal groups space their options by a whole number of
cells.

## States

`data-selected`, `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-invalid`, `data-readonly`, `data-orientation`.

## Tokens consumed

`fg.default`, `fg.accent` (the selected mark), `fg.disabled`, `fg.danger`.

## Accessibility

`radiogroup` and `radio` roles through React Aria: arrows move and select,
Tab enters and leaves the group as one stop. Marks are `aria-hidden`.

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
- [ ] Arrow keys move the selection, Tab leaves the group, in a keyboard story
- [ ] Horizontal and vertical orientations both snapshot on the grid

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
