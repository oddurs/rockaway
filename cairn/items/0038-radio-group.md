---
id: 38
uid: 2ee63611-333b-4b29-ae8a-d6a54ad0fb7e
title: Radio group
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 119
- 127
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
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
- [x] Arrow keys move the selection, Tab leaves the group, in a keyboard story
- [x] Horizontal and vertical orientations both snapshot on the grid

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Claimed with --force past 0127: the field contract is on main (#94); 0127 stays open only for 'used by every field component', which this helps make true.

## 2026-10-03

Built on React Aria's RadioGroup + RadioField + RadioButton (Radio is deprecated in 1.21). The group root takes fieldClass and holds a Fieldset (0127), whose hidden label takes the group's ids, so the legend names the radiogroup and the frame draws required, invalid and disabled from the group. Description and FieldError (with errorMessage) sit under the frame. Orientation is a defineVariants variant written on the options container as data-orientation, so the stylesheet keys on a declared variant and React Aria gets the same value for its arrow keys.

## 2026-10-03

A radio is its mark cell, a cell of air, and its words; the mark is the state (filled/empty from the theme's mark.radio / mark.radio-empty), the chosen one in fg.accent. Pressed reverses the mark cell; invalid draws marks in fg.danger (the frame goes heavy via Fieldset); read-only keeps the chosen mark and blanks the empty ones in their reserved cells, reading 0118's 'value without the control' the way Switch does; disabled dims. The focus ring is drawn on the RadioButton label from data-focus-visible, as for Switch, because focus is on a visually hidden input. Horizontal options are two cells apart (column-gap x-2) and wrap whole radios; radioGroupBuffer models the wrap and a story holds the page to it.

## 2026-10-03

metadata.test gained an implicit role for radio (<input type=radio>), beside button and link, so a part can declare role radio without writing it.

## Result

RadioGroup is a field holding a Fieldset: label in the frame's edge with the required mark, frame heavy when invalid, description and error under it. Radio is mark cell + air + words, filled/empty from the theme, chosen in fg.accent; pressed reverses the mark, read-only blanks the empty marks in their cells, disabled dims; no state changes a cell. vertical/horizontal is a variant; horizontal options are two cells apart and wrap whole radios. radioBuffer/radioGroupBuffer are the snapshots and the model the stories hold the page to.
