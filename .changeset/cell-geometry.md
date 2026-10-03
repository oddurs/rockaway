---
'@rockaway/grid': minor
'@rockaway/css': minor
'@rockaway/react': minor
'@rockaway/tokens': minor
---

Draw box drawing, block elements and cell backgrounds from the cell, not the font (cairn 0116, 0117).

- `@rockaway/grid`: `shapes` and `shapeOf` describe every glyph the junction table can produce, and every block element, as rectangles and arcs measured from the cell's edges and centre. `arcTable` exposes the rounded corners.
- `@rockaway/css`: `shapes.css`, generated from that geometry at build time, strokes each shaped cell with background layers on its own box. Every painted run is a whole cell tall, keeps its colours in print, and strokes in `CanvasText` under forced colors.
- `@rockaway/react`: `paintGlyph` and `paintRule` are one renderer (`paintCells`, `rowRuns`) with two stroke styles. A run's class is now `rk-run` (it was `rk-cells`, which collided with the `.rk-cells` utility), and the rule painter writes the same characters as the glyph painter, transparent, instead of positioned strokes. `ruledSides` is gone. A run is sized from its start and end columns, each rounded to the layout unit, so a run of cells and the same cells one by one land on the same pixels while the cell stays the font's true advance. `checkContinuity`, `expectContinuity` and `formatContinuity` in `@rockaway/react/testing` prove in a real screenshot that every line reaches its cell's edges and meets its neighbour.
- `@rockaway/tokens`: `stroke.glyph.*` (a fraction of the font size) and `stroke.rule.*` (hairlines) set how heavy a line is.
