---
id: 36
uid: 6d078271-c0b8-4a1a-9dc4-f616c3e6433b
title: Checkbox
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
- [ ] Checked, unchecked and indeterminate differ in a glyph, and the three snapshot differently
- [ ] The whole row toggles on press, and the row is at least 44px tall at touch density

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
