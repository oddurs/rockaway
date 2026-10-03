---
id: 42
uid: 570abc45-84f2-4acc-8874-7c47bb60ab01
title: Select
type: component
status: backlog
milestone: primitives
depends_on:
- 34
- 127
- 133
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: components
effort: m
---

## Purpose

Choose one value from a list too long for radios: a branch, a theme, a
language. Not for free text (TextField, or Combobox when typing should
filter), and not for actions (Menu).

## Anatomy

`<Select label>` on React Aria, built from the field parts (0127). The trigger
is a field row, `Theme  [phosphor        ▾]`, exactly `cols` cells wide; the
popover (0034) is at least as wide and holds a List-drawn `ListBox` (cursor,
reverse-video selection, the selected value's `✓` in its mark cell).

## States

`data-open`, `data-focused`, `data-focus-visible`, `data-disabled`, `data-invalid`, `data-required`, `data-placeholder`, plus List's row states inside.

## Tokens consumed

`bg.subtle`, `fg.default`, `fg.muted` (placeholder), `border.control`, `border.focus`, `fg.danger`, and List's row tokens.

## Accessibility

React Aria's select: a button that opens a `listbox`, labelled by the field
label; arrows open and move, type-ahead selects even while closed, Escape
closes, and the value is announced. A hidden native `select` keeps form
submission and autofill working.

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
- [ ] Type-ahead selects with the popover closed, in a keyboard story
- [ ] The popover's rows line up with the trigger's value cell
- [ ] Works inside a Form (0127) with native validation and submission

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
