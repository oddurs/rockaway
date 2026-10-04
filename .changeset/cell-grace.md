---
'@rockaway/react': minor
'@rockaway/css': patch
---

Count cells by the question asked. `cellsIn` (how many fit in a box) keeps its 1/32px snap, exported as `CELL_SNAP`: the box is the page's and nothing may pass its edge. The new `cellsCovering` (how many cover a length laid out in cells) allows a sixteenth of a cell, `CELL_COVER_GRACE`, because errors add across boxes laid end to end and one cell too many is the failure. An overlay as wide as its trigger reads the trigger's cells with `cellsCovering` instead of rounding in CSS, so a trigger a few hundredths of a pixel over thirty cells gets thirty, not thirty-one.
