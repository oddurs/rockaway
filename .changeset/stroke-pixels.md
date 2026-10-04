---
'@rockaway/css': patch
---

Draw every stroke on whole pixels. The glyph painter's strokes are a whole number of pixels, at least one, and every mark inside a cell starts on a whole pixel: each engine snaps a layer's edges outward on its own, so a 1.28px stroke drew one pixel wide in Chromium and two in Firefox and WebKit, and now draws one in all three.
