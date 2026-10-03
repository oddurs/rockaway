---
'@rockaway/tokens': minor
---

The contrast gate now measures every pair the way a browser shows it: the sRGB value, the p3 override as a p3 screen lights it, that override as Chromium reports it in sRGB (which is what axe sees), and the same for rec2020. It reports the view each pair reads worst in, and its margin. `contrast()` returns the worst of them; `contrastIn()`, `worstContrast()` and `luminanceIn()` give each view, and `ContrastResult` gains `view` and `margin`.

Gamut mapping is now CSS Color 4's algorithm, the one the build writes into `tokens.css`, so the gate and the stylesheet agree colour for colour. The terminal theme files change by a step here and there for the same reason.

The generator fits the palette to the gate (`fitContrast`, `fittedPalette`) and prints what it moved. In the default theme's light mode, `ansi.cyan` and `ansi.green` are a little darker: `fg.info` on `bg.page` and `fg.success` on `bg.success.subtle` read below 4.5:1 on a p3 screen and, measured with the real gamut mapping, on an sRGB one too.
