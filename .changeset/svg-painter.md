---
'@rockaway/grid': minor
---

Add `toSvg`, the SVG painter: a screen as a picture, for where a page is not a page (a social card, a favicon, a figure in a README). Box drawing and blocks are drawn from the same shapes as the cell renderer, so lines meet at the cell's edge as they do on the page. Letters come from the caller, as outlines from whatever font it has, or as `<text>` in a font family. Colours resolve through a palette function, as the ANSI painter's do.
