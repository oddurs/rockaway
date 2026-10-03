---
id: 56
uid: 64deca41-fe90-4978-a9c7-926a9b17dbf3
title: Date picker
type: component
status: backlog
milestone: later
depends_on:
- 34
- 127
created: 2026-09-22
updated: 2026-10-03
priority: p3
layer: components
effort: l
---

## Purpose

Choose a date, or a range, from a month drawn like `cal(1)`: a seven-column
grid of three-cell days under `Mo Tu We Th Fr Sa Su`. A grid of characters is
the shape a calendar already has. Not a scheduler.

## Anatomy

`<Calendar>`, `<RangeCalendar>` and `<DatePicker>` on React Aria. The picker is
a field of date segments (`2026-10-03`, each segment editable) with a button
that opens the calendar in a Popover.

## States

`data-selected`, `data-today`, `data-outside-month`, `data-unavailable`, `data-focused`, `data-invalid`, `data-disabled`.

## Tokens consumed

`fg.default`, `fg.muted` (outside the month), `bg.inverse` / `fg.on-inverse` (selected), bold and underline for today.

## Accessibility

React Aria's calendar grid: arrows move by day and week, Page Up and Down by
month, Home and End to the week's ends; the month is announced on change.
Segments are spinbuttons.

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
- [ ] A month is exactly 20 cells wide (7 × 3 − 1), and its snapshot is recognisably `cal(1)`
- [ ] Today, selected and range are distinguishable in greyscale

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
