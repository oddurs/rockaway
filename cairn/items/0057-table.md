---
id: 57
uid: ee14fbc6-8883-43b5-a91b-bf68a9ae8a68
title: Table
type: component
status: backlog
milestone: primitives
depends_on:
- 118
- 119
- 129
- 133
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: components
effort: l
---

## Purpose

Rows and columns of data, drawn the way a terminal draws them: column rules
that join the header rule as `┬ ┼ ┴`, widths solved in whole cells, text
truncated with `…` on a cell boundary, numbers right-aligned. A grid-drawn
table is the thing this system should be best at, and it exercises junctions,
alignment and truncation at once (moved into primitives by the pivot for that
reason). Not a spreadsheet: no cell editing, no resizable columns in this
item.

## Anatomy

`<Table>`, `<TableHeader>`, `<Column>`, `<TableBody>`, `<Row>`, `<Cell>` on
React Aria. Column widths are cells, fractions or `auto` (content), solved by
the layout solver (0081). One buffer draws the frame, the header rule and the
column rules; the cell content is real table markup laid over it. Sortable
columns carry `▲` / `▼` in a reserved cell. Rows select like List rows.

## States

`data-sort-direction`, `data-allows-sorting`, `data-selected`, `data-focused`, `data-focus-visible`, `data-hovered`, `data-disabled`.

## Tokens consumed

`border.default`, `fg.default`, `fg.muted` (header), `bg.inverse` / `fg.on-inverse` (selection), `bg.subtle` (header ground).

## Accessibility

`grid` semantics from React Aria: arrows move between cells, Home and End,
Page keys, Space selects, Enter sorts a focused header. Headers are real
column headers, so a screen reader announces the column with each cell. Rules
are `aria-hidden`; sort direction is announced through `aria-sort`.

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
- [ ] Column rules join the frame and the header rule through the junction table, in a snapshot with three column kinds
- [ ] Truncation never splits a grapheme and never runs past a rule; wide (CJK) text measures two cells
- [ ] Numbers right-align on a cell boundary
- [ ] A table wider than its screen scrolls horizontally in whole cells, as a declared exception; nothing else does

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
