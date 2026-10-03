---
'@rockaway/react': patch
---

`screenshot()` leaves out text that an ancestor with `overflow` other than `visible` clips, so a scrolled list shows only the rows a reader sees and a label too long for its row is cut where the row cuts it. Before, every row in the DOM was drawn, and rows scrolled out of view overwrote the frame.
