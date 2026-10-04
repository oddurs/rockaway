---
'@rockaway/react': patch
'@rockaway/css': patch
---

A screen the page sizes is now drawn at its true size before it has measured, and with no script at all. It used to be drawn at 80 by 24 cells, so a one-line Callout rendered on the server stood about 20 rows tall until the page hydrated. Now `Screen` draws its `fallback` and stretches the last row and column but one to fill its box. Callout, Fieldset, Frame and Divider each pass the smallest box their chrome fits in. Callout's border now also draws over its background, where its prose used to hide it.
