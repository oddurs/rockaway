---
'@rockaway/react': minor
'@rockaway/css': minor
---

Polish `Button` against the contract (cairn 0131). Breaking: the `quiet` variant is removed in favour of `delimiters="none"`, which it always meant, and `size` (with `lg`, which claimed a frame it never drew) is removed along with the `ButtonSize` type; a button is one row. Every cell is now text the component writes: the cell of air either side of the label belongs to the delimiters and goes with them, so the stylesheet sets no padding and the last declared geometry exception is gone. `danger` now draws the theme's `mark.danger` (`!`) in the mark cell inside the opening delimiter, so it reads as danger without its colour, and keeps its delimiters whatever `delimiters` says. `buttonBuffer` draws exactly the cells the component renders.
