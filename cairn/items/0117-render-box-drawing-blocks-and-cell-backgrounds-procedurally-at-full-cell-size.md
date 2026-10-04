---
id: 117
uid: f6d8b603-33ae-4249-afd4-5b5130ed7982
title: Render box-drawing, blocks and cell backgrounds procedurally, at full cell size
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 116
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: grid
effort: l
---

## Problem

0116: lines meet at one density for one font. Everything framed depends on this,
so it lands before the polish pass touches a component.

## Proposal

Implement the decision in the glyph painter, the CSS package and the testing
helpers. Keep the engine pure: it already knows every cell's edges.

## Acceptance criteria

- [x] Every painted cell is a full cell box: nothing in a painted screen takes its height from the font
- [x] Box-drawing cells carry their edge weights, and are stroked by a stylesheet generated at build time from the junction table
- [x] Light, heavy, double and rounded all render, with stroke widths from tokens
- [x] Block elements and the eight bars are drawn by the cell, so a scrollbar thumb is one solid run
- [x] Reverse video and cell backgrounds fill the whole cell: no stripes between rows
- [x] The character stays in the DOM, transparent: copy yields the box, text snapshots are unchanged
- [x] Glyph and rule painters share the renderer; the per-stroke rule painter is retired and 0114 dropped
- [x] Forced colors keeps strokes visible as CanvasText, verified in the forced-colors browser
- [x] Strokes print
- [x] checkContinuity in @rockaway/react/testing pixel-checks that every stroke reaches its cell edges, and runs on every story like conformance
- [x] Continuity passes at all four densities, both painters, every border set, and at 200% zoom
- [x] The before and after measurements are recorded here
- [x] docs/concept.md states the principle and the painters section is rewritten

## 2026-10-03

What landed. The geometry lives in the engine: `packages/grid/src/shape.ts` (`shapes`, `shapeOf`) describes every glyph the junction table can produce (113), the four arcs, and the 32 block elements U+2580–U+259F as rectangles and arcs, in measures that are a fraction of the cell plus light/heavy/gap/radius terms. `packages/css/scripts/shapes.ts` writes `packages/css/src/shapes.css` from it (145 rules, about 3 KB gzipped), committed, and `packages/css/test/shapes.test.ts` fails if it is stale. The painter (`packages/react/src/paint/cells.ts`) writes rows of whole-cell runs; a shaped run says `data-rk-shape="box-0110"` (weights north, east, south, west), `arc-0110` or `block-2588`, keeps its character, and makes it transparent with `-webkit-text-fill-color` rather than `color`, so `currentColor` is still the ink.

Departures from the brief, and why:
- The weights come from the glyph in the cell, not from `buffer.edgesAt`. A title is drawn over border cells whose edges stay set, so only the character says whether a cell is a stroke; and where Unicode has no glyph (double meeting heavy) the engine draws one weight down, so stroking raw edges would need rules for about 140 more keys and would make the picture disagree with the copied text. Everywhere else the two are identical. Cost: a demoted junction steps where it meets an undemoted neighbour, as it does in a font.
- The geometry is in the grid package, not in the generator, so it is data a canvas painter could read, and so it is tested without a browser: the grid tests show that the ink where a line crosses a cell edge depends only on that side's weight, for every glyph, side and five cell proportions, which is continuity for every pair of glyphs at once.
- Arcs are radial-gradient circles of radius min(cell)/2, not an SVG mask: a mask would also cut the cell's background (reverse video), and a circle keeps the stroke width. The straight parts overlap the arc by a whole stroke, so the ink at the edge is always a straight stroke placed exactly as the neighbour's.
- Runs: shapes that span the cell (─ ━ ═ and full-width blocks) coalesce into one run; others are a run per cell. An 80x24 frame is 72 runs whichever painter (the old rule painter: 612 positioned divs).
- ASCII stays font-drawn: `+--+` never joined in a terminal; its cells are still whole cells.
- Stroke tokens: `stroke.glyph.{light 0.08, heavy 0.16, gap 0.12}` x 1em (1.28/2.56/1.92px at 16px) and `stroke.rule.{1px, 2px, 1px}`; `heavy < 2 x light + gap` is asserted, because the junction geometry relies on it.

## 2026-10-03

What only pixels taught (found by checkContinuity, not by reasoning):
- Chrome snaps each background layer to whole pixels on its own. A layer ending exactly on a cell's fractional edge lost that cell's last column (a 1px gap in every double top border at 1x). Layers that reach an edge now overshoot by 1px and the cell's box clips them back.
- Percentage positions align a different point of each layer, so two layers starting at the same place snapped apart and corners grew a nub. Positions are now lengths from the cell's start (via --rk-cell-width/height); sizes stay percentages so a spanning run is one layer.
- At 200% the hairline arc and its neighbour disagreed by a device pixel, because a radial gradient is not snapped and a tile is. Fixed by the whole-stroke overlap above.
- Vitest was scaling the test frame to 0.8 (page 1280x720, frame 1200x900), so screenshots were not the pixels drawn. The page is now 1600x1200; checkContinuity refuses a screenshot whose size does not match the layer.
- A screen's content layer covers its chrome on purpose (Button's "On the grid" story stands three buttons on the divider row). The check makes the content layer transparent for the screenshot: what content covers is the page's business.

How it is proven. `checkContinuity` (packages/react/src/testing/continuity.ts) screenshots each painted layer and, per shaped cell, checks: ink on every reached edge in the cell's own outermost pixels (gap), none mid-edge on unreached ones (leak), neighbours crossing a shared edge in the same pixels (step) with nothing unpainted between (gap), every stroke joined to another inside the cell (broken), ink distinguishable from ground (invisible), and filled runs reaching top and bottom (stripe). Runs after every story from preview.tsx afterEach (screenshot from a Vitest setup file, skipped in the Storybook UI). Matrix in apps/workbench/src/grid/Continuity.stories.tsx: per density, 18 screens (2 painters x [5 border sets + double/single + single/heavy junction frames + blocks + reverse/filled rows]) = 644 shaped cells, 592 joins, 8 filled runs, 0 breaks, at 1x and again in the zoom project at deviceScaleFactor 2. FontDrawn hands the shapes back to the font and the check reports >10 gaps, so a pass means something. Forced colors: ForcedColors › Strokes, in the forced-colors browser (and the check fails there with forced-color-adjust: auto). Print: Continuity › Prints prints a real PDF with background graphics off through a Vitest browser command and counts pattern fills: at least one per stroke layer, and zero once print-color-adjust is taken away.

## 2026-10-03

Before and after, measured in the workbench (macOS Chromium, system mono = SF Mono via ui-monospace, 16px), from screenshots:

| density | cell | before: font `│` ink | before: result | after: cell ink |
| --- | --- | --- | --- | --- |
| dense | 16px | 21px, rows -3..18 | bleeds 3px up, 2px down | rows 0..16 |
| normal | 20px | 21px, rows -1..20 | meets (1px overlap), by coincidence | rows 0..20 |
| airy | 24px | 21px, rows 1..22 | 3px gap between rows | rows 0..24 |
| touch | 32px | 21px, rows 5..26 | 11px gap | rows 0..32 |

After is asserted by Grid/Continuity › Measured at every density, at 1x and 2x. The CTO's 20.4px is the same glyph measured fractionally. DOM for an 80x24 frame: before, glyph 48 nodes and rule 612; after, 96 (24 rows + 72 runs) for both.

## 2026-10-03

One more the tests taught: making each run a block (a flex item) to get a whole-cell box broke copying. A selection puts a line break between block-level elements, so a copied top border came out as three lines. Runs are inline blocks in a block row instead: still exactly one cell tall, and Grid/Painters now asserts that selecting a whole painted screen copies as exactly its text snapshot.

## Result

Lines, blocks and cell backgrounds are drawn by the cell at every density, both painters, every border set and 200% zoom, proven in pixels by checkContinuity after every story; see the notes for the before and after measurements.

## 2026-10-03

CI caught what my machine did not: on Linux fonts the eighth block ▏ failed. That started a sweep across font sizes (15.3–17px) and sub-pixel offsets at 1x and 2x, now a permanent story (Grid/Continuity › At any sub-pixel offset). What it taught: (1) Chrome snaps backgrounds to whole CSS pixels even at 2x, so the device pixel just inside a fractional edge can be bare by design; the check now allows half a CSS pixel at an edge (a one-pixel mark may sit wholly in the boundary pixel), and across a join requires every line between the two cells inked. (2) Run widths are calc(n x cell), each rounded to the layout unit on its own, so a column drifted a fraction of a pixel between rows; the measured cell is now rounded to 1/64px. (3) A radial gradient is not snapped, so at a hairline the arc sat a device pixel off the snapped straight strokes; arcs are now placed on whole pixels and aimed at where the straights are drawn, round(middle - light/2) + light/2, with a pixel of room for the softened edge. (4) With the radius at half the cell, a corner's tangent point sat exactly on the cell edge; it is now half the cell less one light stroke, so a corner always ends in straight stroke at the edge.

## 2026-10-03

Correction after merge (reported by the site lead): rounding the measured cell to 1/64px pushed long runs of real text off the grid, since text sits at the font's true advance (0.55–0.65px over 70–80 cells, past conformance's 0.5px). The cell is the true advance again; instead each run is sized round64((col + n) × cell) − round64(col × cell), so widths telescope to exact column positions. Grid/Continuity › A column is a column proves it: forty one-cell runs and one forty-cell run put the next column 0.33px apart with plain n × cell widths at 15.3px, and on the same pixel with telescoping.
