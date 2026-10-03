---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `List` and `ListItem`, the selection primitive: React Aria's keyboard, type-ahead and selection, a viewport exactly `rows` cells tall that scrolls in whole rows, and selection shown as a cursor glyph and reverse video together, so it survives forced colors and a reader who cannot tell the accent from the ground. The scrollbar is a one-cell column drawn by the engine; `scrollbarBuffer` gives it as a buffer, and `total` tells it how many rows there are.
