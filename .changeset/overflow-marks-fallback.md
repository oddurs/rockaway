---
'@rockaway/react': minor
'@rockaway/css': minor
---

Show the overflow marks where the browser has no scroll-state queries (Firefox and Safari today): `watchOverflowMarks()` writes which edges have more past them as `data-rk-more`, and `scroll.css` shows the marks from it. It does nothing where the query works, and with JavaScript off a region scrolls without marks, as before. `Table` calls it for its own scrolling region.
