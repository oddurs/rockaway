---
'@rockaway/css': patch
---

A List row clips what it holds. At dense the line box is shorter than the font's ascent and descent, and the text that ran past a row was scrollable overflow: a list of three rows in a box of three had a pixel to scroll, and moving through it by keyboard left every row a pixel off the grid.
