---
'@rockaway/grid': minor
'@rockaway/css': minor
'@rockaway/react': minor
---

Draw braille from the cell, like blocks (cairn 0166). The engine describes all 256 patterns as square dots (`brailleMarks`, a shape's `dots`), the stylesheet draws them from one rule with a layer a dot, raised by `data-rk-dots`, and the painter writes that attribute. `shapeAttributes(ch)` gives a single chrome element, such as a spinner's frame, the same attributes, so it needs no font with braille.
