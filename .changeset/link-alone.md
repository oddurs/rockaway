---
'@rockaway/react': patch
'@rockaway/css': patch
---

A `Link` that stands alone, with no words of its parent's beside it, now takes the whole line box as its target: a cell tall at every density, 44px at touch, where it was as tall as the font. It is marked `data-rk-alone` once the page has rendered, and drawn as an inline block. A link in a sentence is unchanged: inline, wrapping with its words.
