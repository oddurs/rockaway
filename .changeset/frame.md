---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Frame`, the box every other component is drawn inside. `frameBuffer(size, options)` draws a border set, a title set into the top edge and dividers that join the sides they meet, with no DOM; `Frame` renders it through `Screen`, takes its accessible name from the title rather than the glyphs around it, and pads its content in cells with `pad`. `Screen` now passes HTML attributes to its host and takes a `contentInset` in cells. `@rockaway/css` ships the screen styles — `.rk-screen`, `.rk-frame`, `.rk-content` — which until now existed only in the workbench.
