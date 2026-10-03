---
'@rockaway/css': minor
'@rockaway/react': minor
---

No native scrollbar is drawn anywhere. A classic scrollbar, which you get with a mouse attached or with "always show scroll bars", took about fifteen pixels from List's viewport, leaving its rows off the grid beside a second scrollbar. Give anything that scrolls the new `rk-scroll` class to hide the browser's bar; List's viewport has it. Prose code blocks and tables hide it too. They now mark each edge that has more past it with the theme's `‹` and `›`, through the new `rk-scroll-marks` class. A table shows its marks when it is wrapped in `<div class="rk-scroll-marks">`. Prose code blocks now pad their code rather than the block, so the marks reach the edge. `@rockaway/react/testing` adds `checkScrollbars` and `expectNoNativeScrollbars`, which flag any element whose computed overflow scrolls without `scrollbar-width: none`.
