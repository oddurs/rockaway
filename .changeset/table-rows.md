---
'@rockaway/react': minor
'@rockaway/css': minor
---

`Table` takes `rows`, the body rows it shows at once. The table is exactly that tall, so it fits a Pane without counting its chrome by hand, and its body scrolls down in whole rows, following the cursor as the arrows move it. A scrollbar drawn in cells, List's, stands in the cell inside the right edge. There is no native scrollbar, and with no script the first rows are drawn at the same height. `tableBuffer` takes `visible` and `offset` to draw the same window as text.
