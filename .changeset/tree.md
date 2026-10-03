---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Tree` and `TreeItem`, a hierarchy to expand and collapse on React Aria's `Tree`: arrows, right to expand, left to collapse or go to the parent, Home and End, type-ahead, selection, and `href` rows that navigate on Enter or a press while the expand mark only expands. Rows behave like List's, with the theme's cursor mark in a reserved first cell, reverse video for selection and a check under multi-select. Depth is drawn as guides, two cells a level: each row's guides are edges the junction table draws (`├─`, `└─`, `│`), painted as runs the cell renderer strokes, with the `painter` prop choosing the stroke. A long title is cut with an ellipsis and the guides stay whole. `treeBuffer` and `treeGuides` draw the tree as text.
