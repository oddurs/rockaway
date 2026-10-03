---
'@rockaway/react': minor
'@rockaway/css': minor
---

List draws the cursor and the selection apart, as the state vocabulary says. The cursor mark now marks only the keyboard's row, and no longer appears on a selected row. A selected row is reverse video, made by swapping the list's own colours so that it still shows in forced colors. Under `selectionMode="multiple"`, every row reserves a second cell for the check mark. An empty list shows `empty` ("Nothing here." by default) through React Aria's `renderEmptyState`. The scrollbar counts its rows from the collection, so `total` is needed only for a list that does not hold every row. A scrolled list snaps to whole rows. A row with a plain text label no longer needs `textValue` for type-ahead. Adds `listBuffer`, which draws the whole list as cells, along with `listMarks` and `listRowStyle`.
