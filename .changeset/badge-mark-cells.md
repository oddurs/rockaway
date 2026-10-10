---
'@rockaway/css': patch
---

A `Badge`'s mark and delimiters take exactly their cells: two for the mark and its cell of air, one for each delimiter. A mark drawn by a fallback font, as a ✓ is on fonts that lack it, could be wider than a cell. That put the words after it off the grid, and wrapped a sentence around the badge a word early.
