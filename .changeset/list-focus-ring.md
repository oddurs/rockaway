---
'@rockaway/css': patch
---

A List now shows the focus ring when it holds focus itself and no row has the cursor. That happens when the list has no rows, or when its selected row is disabled, so React Aria cannot enter on it. Until now that focus was invisible, so the first arrow key seemed to do nothing.
