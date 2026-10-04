---
'@rockaway/react': patch
---

`Screen` measures its cell again when its context changes: a new density, a font that loads late, or a reader's larger text. A screen given its size in cells sizes its own box from its cell, so its box never resized and its ResizeObserver never heard of the change; it kept a 20px cell inside a 24px line box, and everything drawn in it was off the grid. It now also watches a hidden one-cell probe, `1ch` by `1lh`, which resizes whenever the cell does.
