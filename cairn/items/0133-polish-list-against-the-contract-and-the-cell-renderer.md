---
id: 133
uid: 3a7889fb-5909-44f1-b1b7-50056f1eb839
title: Polish List against the contract and the cell renderer
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 47
- 117
- 118
- 119
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: m
---

## Problem

List shipped in 0100 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- Focus and selection are drawn identically (reverse video for both), so in a
  multi-select list the cursor is invisible. 0118 separates them.
- `▸`, `░` and `█` are literals in the component.
- The row height starts as a hard-coded 20px until the first measurement.
- There is a snapshot of the scrollbar and none of a list.
- Disabled rows only dim; empty collections render nothing at all.
- At touch density, a scrolled list must still land on whole rows.

## Acceptance criteria

- [x] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [x] Both painters render it identically: a test asserts it for every variant, not only the default
- [x] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [x] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [x] Metadata written to the schema (0047), and validated by its test
- [x] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [x] The body of 0100 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [x] Focus and selection are distinguishable in a multi-select list, in a snapshot and in forced colors
- [x] An empty list draws an empty state, through React Aria's `renderEmptyState`
- [x] No hard-coded pixel value is left in the component
- [x] A pure `listBuffer` draws the whole List (rows, cursor cell, scrollbar) and `ListItem` renders from it, so List's snapshot is the component and not only its scrollbar
- [x] List counts its rows from the collection, not from one `scrollHeight` read taken before React Aria renders it; stories that pass `total` only for this stop passing it

## 2026-10-03

Cursor and selection are split as 0118 says. listMarks gives the reserved cells: the cursor's, and under multi-select the check's. listRowStyle gives a row's attributes. listBuffer draws the whole list, rows and scrollbar, from both. ListItem draws its marks with listMarks, the scrollbar is scrollbarBuffer, and the As text, Densities and Empty stories check that screenshot() of the page equals listBuffer. Attributes stay in list.css, read from React Aria's data-*. listRowStyle restates them, and the stories hold the computed styles to it, the pattern Link uses.

## 2026-10-03

Selected is reverse video by swapping fg.default and bg.surface, not the bg.inverse/fg.on-inverse pair. forced-colors.css maps both halves of that pair to Canvas, so a row reversed with it vanishes in forced colors. I swapped the CSS back to the pair and confirmed the Forced colors story fails with it. Button's fill and pressed, and painted cells with data-attrs=reverse, use the pair and have the same problem; proposed as a follow-up.

## 2026-10-03

Rows are counted from React Aria's collection. Rows render inside ListStateContext, so a CountRows component in each row reports state.collection.size to List through a context. The empty state reports 0. total remains only for a list that does not hold every row (0115, async), and no story passes it any more. The offset is read on scroll from the measured cell, so the hard-coded 20px start is gone. Scroll snapping is back (scroll-snap-type on the box, align start on rows): 0100 ruled it out while the Virtualizer was in, and without it the keyboard and wheel both land on whole rows at every density. The metadata test now also accepts a state drawn as a mark from React Aria's render prop (isFocused), since the cursor is a glyph and not a style.

## 2026-10-03

Seen but not fixed: with a row that is both selected and disabled, Tab lands on the first row and the first ArrowDown does nothing (React Aria's focusedKey appears to start on the disabled selected row). The Disabled story checks the keyboard skip on a list without that combination. Hover is not a cell attribute in screenshot(); listBuffer's Node snapshot carries it in its legend.

## Result

List draws the cursor and the selection apart, as 0118 says. listBuffer draws the whole list as cells, and ListItem draws its marks with the same listMarks. Rows are counted from React Aria's collection. Selected is the list's own figure and ground swapped, so forced colors keeps it.
