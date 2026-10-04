---
id: 57
uid: ee14fbc6-8883-43b5-a91b-bf68a9ae8a68
title: Table
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 118
- 119
- 129
- 133
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
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
- [x] Column rules join the frame and the header rule through the junction table, in a snapshot with three column kinds
- [x] Truncation never splits a grapheme and never runs past a rule; wide (CJK) text measures two cells
- [x] Numbers right-align on a cell boundary
- [x] A table wider than its screen scrolls horizontally in whole cells, as a declared exception; nothing else does

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built in packages/react/src/components/table.tsx. Chrome: tableChromeBuffer draws the box (title via drawBox, so it stops before the first ┬ per 0175), the header rule at row 2 with Divider's drawRule, and a vertical drawRule per column rule; every crossing is the junction table's. An empty table's column rules stop at the header rule (┴), because its one row of words spans the table. Content: React Aria's Table as a CSS grid of whole-cell tracks (thead/tbody/tr subgrid), laid over the screen's content layer at inset 1,1. The rule cells are a cell of padding at the end of each th/td (background-clip content-box), not a transparent border: border widths snap to whole pixels and broke conformance by 0.06 cells. The header rule row is a row of padding under each th.

## 2026-10-03

Columns: a track is lead (1 cell of air; in column 0 the row's mark cells, 1 or 2 under multi) + content + 1 trail cell, which in the header holds the sort mark (theme mark.sort-ascending/-descending, blank on an unsorted sortable column). Content widths come from tableLayout over the grid's solve(): number = fixed, 'Nfr' = grow with min(header,4) or minWidth, 'auto' = widest value or header. The table learns its columns from inside React Aria's collection (the handbook's collection gotcha): a Measure component rendered in each Column reads TableStateContext's collection (columns' props carry data-rk-width/align/min-width; cells' textValue) and reports up. Cells get their column index from React Aria's columnIndex render prop; headers read their cellIndex off the DOM after mount. Text and numbers are cut in JS with truncate() (grapheme-safe, wide chars two cells, theme ellipsis) and padded to align, so every cell writes exactly its cells; a cut value renders aria-hidden with the whole value in a VisuallyHidden beside it.

## 2026-10-03

States: cursor is computed in the first cell from TableStateContext (focusedKey is the row or one of its cells); selected reverses each cell (bg.inverse/fg.on-inverse, forced-color-adjust none) with the rule cells left unreversed; multi adds the check; hover underlines values; disabled dims. Overflow: when the solved columns exceed the room, the wrapper becomes rk-scroll rk-scroll-marks (from #107) with scroll-snap to column starts and data-rk-offgrid declaring it; the Scrolls story runs with continuity off (cells scrolled out of view cannot be photographed) and is tagged classic-scrollbars. Not built: column resizing and cell editing, out of scope per the item.

## Result

Table draws its frame, header rule and column rules in one buffer, joined by the junction table, with React Aria's grid laid over it in whole-cell tracks. Columns are cells, fr shares or auto, solved in whole cells; text is cut on graphemes with the theme's ellipsis and read whole; numbers right-align. Cursor mark, reverse selection, a check under multi, sort marks from the theme, no state moves a cell. A table too wide for its room scrolls across in an rk-scroll-marks region, snapping to columns, declared off-grid. tableBuffer is the snapshot and the model the stories hold the page to.
