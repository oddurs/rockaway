---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Button`: delimited text, `[ Publish ]`, that inverts when you press it. Variants are `default`, `fill` (reverse video, the primary), `quiet` (no delimiters) and `danger`, in sizes `md` and `lg`. Behaviour and every state attribute come from React Aria, the delimiters are hidden from the accessible name, and hover underlines and disabled dims, so no state depends on colour alone. The reset now removes the browser's padding and border width from controls, which put every button a fraction of a cell off the grid.
