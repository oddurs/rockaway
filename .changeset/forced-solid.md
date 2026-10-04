---
'@rockaway/css': patch
---

Under forced colours, a solid control (`bg.*.solid` with `fg.on-*`) is now reverse video in the reader's own pair: CanvasText ground, Canvas text. It used to be drawn in Highlight and HighlightText, which is the selection pair, and nothing promises that pair reads; Firefox's emulated palette pairs them at 2.94:1. Highlight stays for selection (cairn 0215).
