---
"@rockaway/react": minor
"@rockaway/css": minor
---

Add `Toolbar` (0318), with `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator`: a row of commands that is one tab stop, with the arrow keys between commands. Each command is padded half a cell either side, so labels land on whole cells, and groups are a rule apart. What doesn't fit folds into the theme's ellipsis in the bar's last cell, which opens a Menu of the folded commands. `toolbarBuffer` draws one as text.

`screenshot()` skips text in an element that is `visibility: hidden`. Nobody can see that text, so it isn't on the screen.
