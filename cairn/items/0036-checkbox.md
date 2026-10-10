---
id: 36
uid: 6d078271-c0b8-4a1a-9dc4-f616c3e6433b
title: Checkbox
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 119
- 127
created: 2026-09-22
updated: 2026-10-10
closed_at: 2026-10-10
priority: p1
layer: components
effort: s
---

## Purpose

One yes-or-no choice, or several independent ones in a group: `[✓] Sign
commits`. Not for an immediate on/off setting (Switch), and not for one choice
out of many (Radio group).

## Anatomy

`<Checkbox>` and `<CheckboxGroup label>` on React Aria. A row is the control
delimiters around a reserved mark cell, one cell of space, and the label:
`[✓] Label`, `[ ] Label`, `[–] Label`. A group is a Fieldset (0127) with its
legend in the frame's top edge.

## States

`data-selected`, `data-indeterminate`, `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-invalid`, `data-required`, `data-readonly`.

## Tokens consumed

`fg.default`, `fg.accent` (the mark), `fg.disabled`, `fg.danger`, `border.control`.

## Accessibility

Native checkbox semantics through React Aria; the label is the name and the
whole row is the hit target. Space toggles. Marks and delimiters are
`aria-hidden`; the state is announced by the role. Indeterminate is
announced as "mixed".

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
- [x] Checked, unchecked and indeterminate differ in a glyph, and the three snapshot differently
- [x] The whole row toggles on press, and the row is at least 44px tall at touch density

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built on React Aria 1.21's CheckboxField and CheckboxButton (Checkbox is deprecated there): the field is the root with fieldClass, the button is the label element around the hidden native checkbox, so the whole row is the press target. A row is text: [mark] air words mark-cell. The required mark reuses Label's .rk-label-mark cell after the words, so checkField reads it the same way; inside a CheckboxGroup the rows draw no mark (CheckboxGroupStateContext) and the group's Fieldset legend carries it, once. Pressed reverses the box as its own figure and ground (fg.default behind bg.page), opting out of forced-color adjustment as 0181 does.

## 2026-10-03

Criteria 11 and 19 left open on the same ground as Text field: keyboard alone and the whole row toggling are proven (Keyboard, The whole row toggles), and the row is one cell tall at every density, but touch is 32px until 0197 makes the touch line box 2.75. The target check also measures the hidden native input (13x13) rather than the row; forms2 is fixing checkTargets to measure a hidden input through its label (feat/switch).

## 2026-10-03

Criteria 11 and 19 ticked after merging 0198 (#112): touch's line box is 2.75, so a row is 44px at touch, and the Touch story asserts it. Also fixed what CI caught: the box's three cells were text, and a mark the font lacks comes from a fallback whose advance is a hair off the cell, so the box was 0.03px wider checked than unchecked. Each of the three is now an inline-block exactly a cell wide.

## 2026-10-10

On main; every criterion ticked. Closed from review.
