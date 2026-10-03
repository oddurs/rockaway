---
'@rockaway/css': patch
---

The reset now clears a control's background along with its padding, border and colour, so a bare `button`, `input`, `select` or `textarea` sits on the page's ground. Before, in dark mode a button kept the browser's own face (#6b6b6b in Chrome) under the page's text, at 4.46:1.
