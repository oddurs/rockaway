---
'@rockaway/grid': minor
'@rockaway/react': patch
---

A title never loses a letter to a junction, and a junction never loses its tee to a title (cairn 0175). Titles and a rule's labels are recorded with `drawLabel` and set into their edge when the draw pass closes: each owns its cells, stops short of the first rule crossing its edge, and truncates with the theme's ellipsis, whichever was drawn first. A label may now run to one cell of edge from the far end (`╭ rounded ─╮` fits at twelve), and `truncate` drops a space before the ellipsis.
