---
'@rockaway/react': minor
---

`Tree` takes `disallowTypeAhead` and `onFocusedKeyChange`.
- **`disallowTypeAhead`:** a printable key isn't taken for type-ahead, so it reaches the page's own shortcuts, as a site's navigation needs beside `j`, `k` and `/`. The arrows, Home and End still move. It's React Aria's own option: its Tree honours it through the grid list it's built on, as its GridList does.
- **`onFocusedKeyChange`:** called with the row that has focus whenever it changes, and with `null` when focus leaves the tree.
