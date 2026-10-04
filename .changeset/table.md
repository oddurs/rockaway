---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Table`, with `TableHeader`, `Column`, `TableBody`, `Row` and `Cell`: rows and columns of data drawn the way a terminal draws them. One buffer draws the frame, the header rule and the column rules, and the junction table joins them (`┬ ┼ ┴`, `├ ┤`); a title set into the top edge stops short of the first column rule. The cells are React Aria's grid laid over the chrome, so the arrows move between cells, Space selects, Enter sorts a focused header, and every value is announced with its column.

Columns are whole cells. A `Column`'s `width` is cells (`6`), a share of the room left (`'1fr'`), or `'auto'` (the default), as wide as its widest value; `align="end"` right-aligns numbers. Text longer than its column is cut on a grapheme with the theme's ellipsis, never past a rule, wide characters count two cells, and a reader still hears the whole value. The focused row carries the cursor mark, a selected row is reverse video, and under multi-select the check sits in a second reserved cell; the sorted column shows the theme's sort mark in its header's last cell. No state changes a cell. `Table` takes the room it has in `cols`, or measures its container; a table wider than its room keeps its columns and scrolls across in an `rk-scroll-marks` region, snapping to a column's start. `tableBuffer` draws any table as text, and `tableLayout` solves its columns.
