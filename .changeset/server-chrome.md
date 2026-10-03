---
'@rockaway/react': minor
---

Render a screen's chrome on the server (cairn 0126). `Screen` renders its buffer as rows of runs (`Chrome`, `chromeRows`) instead of painting them in an effect, so a server sends the frame in its first response, a page with JavaScript off still shows it, and hydration keeps the same nodes. Until it measures, a screen's cell is `1ch` by `1lh` rather than a guessed 8.4×20px, so a fixed-size screen does not change size on hydration. The buffer functions (`frameBuffer`, `dividerBuffer`, `drawRule`, `scrollbarBuffer`, `buttonBuffer`, `linkBuffer`, `badgeBuffer`, `formatKeys` and the rest) move to modules without `'use client'`, so a server can call them, and the List's scrollbar is rendered on the server too.
