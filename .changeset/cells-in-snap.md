---
'@rockaway/react': patch
---

A measured `Screen` exactly n cells wide counts n cells again. Since the cell became the font's true advance, layout's 1/64px snapping could leave such a box a hair under n cells, and `cellsIn` floored it to n − 1, so a fieldset in a form drew its frame a cell short of its column. `cellsIn` now allows a box a snap or two of layout short of a whole cell, and no more, so a box that really is short still never has a cell drawn past its edge.
