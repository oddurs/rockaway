---
'@rockaway/react': minor
'@rockaway/css': patch
---

A Tree label that does not fit is cut in the theme's ellipsis, in its last cell, as `treeBuffer` draws it, instead of CSS `text-overflow`, which drew the font's `…` under every theme. The whole title stays the text, so it is still found, copied and announced; with no script the label clips at its edge. `screenshot()` reads the mark where it is drawn.
