---
id: 311
uid: 4092738b-fea5-4d7f-b998-6cbf5cc73720
title: 'Lay out on one grid in three tiers: structure, rhythm and free'
type: decision
status: done
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p0
layer: grid
effort: l
---

## Question

How does rockaway stay a grid of character cells, where every line meets, while giving a modern web app and website the spacing, type and imagery they need? Forms confined to whole cells feel cramped; a sectioned dropdown in a toolbar, breadcrumbs, prose and images want rhythm finer than a cell.

## Decision

**One grid, three tiers. Snap at the seams, free inside.** Approved by the owner, 2026-10-09.

| Tier | What lives there | Unit | Must land on |
|---|---|---|---|
| Structure | frames, panes, rules, tees, tables, status and tool bars, overlay edges, scrollbars | whole cells | whole cells, always |
| Rhythm | gaps, padding, field spacing, menu sections, toolbar item spacing | half-steps: ½ row, ½ column | half-steps; its block's seams on whole cells |
| Free | prose leading, images, icons, a control's internals, motion | anything CSS can do | nothing but its block's outer box |

**The seam rule.** A block whose inside is not whole cells pads its outer box up to the next whole cell, so fractional spacing never escapes the block that uses it. Everything outside it (the frame round it, the next block, the pane below) stays on the grid, and lines keep meeting.

**The levels map onto the tiers**, chosen per screen:
- `strict`: structure only.
- `standard`: structure and rhythm. The default for app UI.
- `loose`: structure, rhythm and free zones. Marketing, docs and media.

**The owner's three answers:**
1. Half-steps are the only rhythm unit. Quarter rows are allowed only inside free zones (prose leading, optical type).
2. Forms are comfortable by default; compact is chosen deliberately, for toolbars and dense tools.
3. Images are real images by default; a terminal render (braille or half blocks) is an optional look.

## Units and tokens

- `--rk-step-x` is half a cell's width and `--rk-step-y` half a row's height. The spacing scale, in rows and columns: 0.5, 1, 1.5, 2, 3, 4, 6.
- Horizontal half-steps pair up: a control padded ½ column each side is its label plus 1 column, whole again, so monospace text in neighbouring rows still lines up. An unpaired horizontal half-step is allowed only in a free zone.
- A **comfort** axis, separate from density: `compact`, `comfortable`, `spacious`. Density changes the cell (the row's height); comfort changes the rhythm (the spacing between things), and can be set per region.

## Snapping a block to whole cells

1. **Height known at render** (most components): rhythm is declared in half-steps, the buffer function sums them and pads to whole rows, on the server, with no script. A comfortable field: ½ + 1 + ½ = 2 rows; with a label above and help below, 4.
2. **Height set by content** (prose, user text): `calc-size(auto, round(up, size, var(--rk-cell-height)))` where the engine supports it (Chromium); elsewhere a small ResizeObserver sets `min-height`. With no script outside Chromium a block may sit half a row off, which only `loose` tolerates.
3. **Media**: an image's box is cols × rows from its aspect ratio, rounded to whole rows, the picture cropped to fit. Exact, no script.

## What never breaks

Lines meeting; one monospace; the cell renderer draws every line; rounded corners only as the theme's ╭╮╰╯ glyphs; no blur or shadow on structure; state readable without colour. Horizontal rules and tees stay on whole rows, so a menu's section gap sits beside its rule, never in it. Vertical borders run continuously past content offset by half a row.

## Consequences

- `@rockaway/grid` works in half-units internally and gains `Flow`, a vertical run of blocks with rhythm gaps whose total snaps to whole rows.
- `checkConformance` learns the tiers and the seam check; a rhythm audit reports every non-whole spacing so review can see where the rules bend. `checkContinuity` is unchanged.
- New and changed components: comfortable Field, sectioned Menu/Select/Combobox, Toolbar, Breadcrumbs, Picture, Card, Prose rhythm, half-step type sizes.
- The site adopts it: docs pages as Flow, the settings example comfortable, a sectioned toolbar dropdown in the shell.
