---
id: 136
uid: 7eab8a03-d1b8-4fe3-855e-19668277dab6
title: Panes
type: component
status: backlog
milestone: primitives
depends_on:
- 81
- 117
- 129
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: l
---

## Purpose

Split a screen into framed panes that share their borders: the layout of
every TUI, and of the site's shell (0104). The panes' borders are one set of
edges, so where two panes meet the junction table draws `┬ ┼ ┴`, not two
boxes side by side. Not a resizable splitter (0097's note: that would be a
different component with real behaviour) and not a general CSS grid.

## Anatomy

`<Panes direction cols|rows>` and `<Panes.Pane size title>`, nestable. Sizes
are cells, fractions or `auto`, solved by the layout solver (0081). One
`Screen` draws all the borders; each pane's content is placed in its cells.

## States

`data-direction`, and on each pane `data-collapsed` when the container is too
narrow for it.

## Tokens consumed

`border.default`, `bg.surface`, `fg.default`; the border set from the theme.

## Accessibility

Each titled pane is a region whose accessible name is its title. Panes add no
keyboard behaviour of their own: focus moves through the content in DOM
order.

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
- [ ] Nested panes share edges, and every seam is a junction from the table, in a snapshot of a three-pane layout
- [ ] Collapse rules by container width at 40, 60, 80 and 120 cells, asserted at each width
- [ ] Sizes in cells, fractions and `auto` are solved by the layout solver, with no remainder left off the grid
