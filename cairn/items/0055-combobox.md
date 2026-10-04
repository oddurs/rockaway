---
id: 55
uid: 0795fc10-3a42-4b94-8053-af06525955e8
title: Combobox
type: component
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-04
depends_on:
- 34
- 35
- 133
created: 2026-09-22
updated: 2026-10-04
priority: p2
layer: components
effort: m
---

## Purpose

Type to filter a list and pick a value: an author, a file, a timezone from
four hundred. Not for a handful of options (Select, Radio group), and not for
commands (CommandPalette).

## Anatomy

`<ComboBox label>` on React Aria: a TextField (0127, 0035) with a `▾` button,
and a Popover (0034) of List-drawn rows below it. Matched characters are
underlined and bold in the rows.

## States

`data-open`, `data-focused`, `data-invalid`, `data-disabled`, `data-required`, plus List's row states.

## Tokens consumed

TextField's and List's tokens; `fg.accent` for matched characters as well as the attributes.

## Accessibility

React Aria's combobox: `aria-autocomplete="list"`, arrows move through the
options while focus stays in the input, Enter selects, Escape closes then
clears. The number of results is announced as it changes.

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
- [ ] Matched characters are marked by attribute, not only colour, in a snapshot
- [ ] Allows or forbids a custom value, by prop, both covered by stories

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-04

Claimed with --force at the CTO's word: Text field (#117) has landed but 0035 is still 'in review' on main; Popover is #153, queued. Built on feat/select (#152, which carries Popover) with main merged, so this stacks on #153 then #152.
