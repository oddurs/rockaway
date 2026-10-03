---
'@rockaway/css': patch
---

Reverse video now shows in forced colors. Before, the inverse pair was mapped to the canvas on both halves, so nothing looked reversed, and the backplate the browser paints behind text hid the words of anything that did swap its colours. Now `bg.inverse` is `CanvasText` and `fg.on-inverse` is `Canvas`, and reversed elements opt out of the adjustment. This covers Button's fill and pressed states, a pressed Link, a selected List row and painted reverse cells, which are all drawn in the reader's text colour with their words in the canvas colour.
