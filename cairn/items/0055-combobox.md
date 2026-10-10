---
id: 55
uid: 0795fc10-3a42-4b94-8053-af06525955e8
title: Combobox
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 34
- 35
- 133
created: 2026-09-22
updated: 2026-10-09
closed_at: 2026-10-09
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
- [x] Matched characters are marked by attribute, not only colour, in a snapshot
- [x] Allows or forbids a custom value, by prop, both covered by stories

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-04

Claimed with --force at the CTO's word: Text field (#117) has landed but 0035 is still 'in review' on main; Popover is #153, queued. Built on feat/select (#152, which carries Popover) with main merged, so this stacks on #153 then #152.

## 2026-10-09

Built stacked on #152 (Select, which carries #153 Popover). The box is TextField's: useCellScroll moved out of text-field.tsx into src/cell-scroll.ts so both share it. The last three cells (end overflow cell, open mark, closing delimiter) are RAC's Button, so a finger gets a 3-cell target and the button is out of the tab order. Matches: Matched reads ComboBoxStateContext inside the ListBoxItem, since items render from the collection. Filtering folds case and accents per grapheme, as RAC's contains at base sensitivity. allowsEmptyCollection + renderEmptyState keeps the popover open saying 'No matches'. Found and fixed an overlay bug: the body's ResizeObserver missed content shrinking inside a body held at maxRows, leaving a stale thumb; it now observes the body's children too.

## Result

ComboBox and ComboBoxItem: a text field's box with a three-cell open button, List rows in a Popover, matches underlined and bold in the accent, filtering without case or accents, a muted row when nothing matches.
