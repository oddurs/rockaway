---
'@rockaway/react': minor
---

Add `Screen`: measures its container in cells from the font's own metrics, draws a buffer that size, and hands it to a painter. Resizes through one `ResizeObserver`, renders on a server without a browser, and `renderScreenToText` gives the same screen as text for a first paint with no JavaScript.
