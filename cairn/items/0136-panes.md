---
id: 136
uid: 7eab8a03-d1b8-4fe3-855e-19668277dab6
title: Panes
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 81
- 117
- 129
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

`<Panes direction border label cols|rows>` holding `<Pane size min priority
title titleAlign pad label>`s. A `Pane` whose only child is a `Panes` is split
again inside the same borders (nested `Panes` never mount a screen of their
own). `Pane` is a sibling export, as `ListItem` is, not `Panes.Pane`:
`isolatedDeclarations` refuses a property assigned to a function.

`layoutPanes(size, split, options, glyphs)` is the pure layout. It returns the
borders as one buffer and where each leaf pane's content goes; `panesBuffer` is
just the buffer, for snapshots. The outer box is `drawBox`, each rule between
panes is Divider's `drawRule` from border to border, so every seam is a tee or
a crossing from the table, and each leaf's title is a label in its own top edge
(0175). That edge is the screen's border or the rule above the pane, and the
title stops short of any junction in it.

Sizes along a split are a number of cells, `'Nfr'`, or `'auto'` (the default):
a share of what the fixed panes leave, in proportion to weight, as `fr` means in
CSS. A share below its minimum is held there while the rest share again, and
the solver does every pass, so sizes are whole cells, remainders go by largest
remainder, and one cell more moves one boundary. `auto` is a weight of one that
never shrinks below its title. Whatever is left over goes to the last pane, so
every cell is a border, a rule or a pane's. The content is real elements in
`.rk-pane` boxes positioned in whole cells (`--rk-pane-x/y/cols/rows`), padded
one cell across like `Frame`, clipping what does not fit but letting a focus
ring through.

## States

`data-direction` on the root (a variant, `panesVariants`). On each leaf,
`data-rk-pane` always, and `data-collapsed` plus `hidden` when the container is
too narrow for it. When the minimums do not fit, the lowest `priority`
collapses first (the later of equals), until the rest fit or one is left. A
collapsed pane stays mounted, so its content keeps its state. None of 0118's
interaction states apply.

## Tokens consumed

`border.default` for every border and rule, `fg.default` for titles, both
carried per cell; the border set from the theme. No ground of its own: `bg.surface`
was planned and is not needed.

## Accessibility

Each titled pane is a region whose accessible name is its title. Panes add no
keyboard behaviour of their own: focus moves through the content in DOM
order.

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
- [x] Nested panes share edges, and every seam is a junction from the table, in a snapshot of a three-pane layout
- [x] Collapse rules by container width at 40, 60, 80 and 120 cells, asserted at each width
- [x] Sizes in cells, fractions and `auto` are solved by the layout solver, with no remainder left off the grid

## 2026-10-03

API: Pane is a sibling export, as ListItem is, not Panes.Pane: isolatedDeclarations refuses a property assigned to a function. Panes reads its Pane children, and any Panes nested in them, into one spec, and one Screen draws every border. Screen gained function children, called with the size it drew at, so pane content is placed by the same layout as the chrome without measuring twice.

## 2026-10-03

Sizes: the solver's grow tracks give each pane its minimum and then share the rest, so 2fr and 1fr with different minimums did not come out 2:1. sizesOf runs it as fr does in CSS instead: weighted shares first, and any share below its minimum is held there as fixed while the rest share again, every pass through the solver. 'auto' is a weight of one that never shrinks below its title (title width + 3, what a label needs), which gives it a meaning the engine can compute without measuring content. Leftover cells go to the last pane, and a test walks widths 3 to 200 to prove every column is a border, a rule or exactly one pane.

## 2026-10-03

Collapse: when the minimums along a split do not fit, the lowest priority pane collapses (the later of equals), until they fit or one is left. A nested split's minimum along its own axis is its highest-priority pane, so a parent keeps a split while anything in it fits. A collapsed pane is hidden, with data-collapsed, not unmounted: the Resize story types into a pane, narrows it away and back, and the text is still there. Asserted at 120, 80, 60 and 40 cells in Node and from real containers in the Collapse story. data-collapsed is layout, named in this ticket, not one of 0118's interaction states, and it never changes the screen's own size: every cell is still allocated. Criterion 14 is ticked on that reading.

## 2026-10-03

Proof: Variants (one story per painter) draw seven layouts, every border set, a grid of nested splits and an ASCII theme. Each is held to its buffer's text and runs. Continuity runs at four densities by two painters, tagged zoom, so 200% too. Strict holds the shell to the strict conformance level. Keyboard: no pane is a stop, Tab walks content in DOM order. Also Touch, Dark and Forced colors. Every leaf sets data-rk-pane, which 0182 asks of pane-like containers.

## Result

Panes and Pane: one buffer draws every border, so seams are junctions from the table and titles sit in their own edge. Sizes in cells, fr and auto are solved in whole cells as CSS fr does, and nothing is left off the grid. Panes collapse by priority below their minimums, hidden rather than unmounted, asserted at 120, 80, 60 and 40 cells.
