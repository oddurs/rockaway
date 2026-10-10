---
'@rockaway/react': patch
---

`checkContinuity` judges a shape's own marks set in from an edge by the shape's geometry: a braille dot or the bare eighth of a block antialiases into the pixels next to the cell's edge, and only lines a whole pixel clear of the nearest mark are read for a leak.
