---
---

No package changes. The built-site test now waits for the page to settle: the font is loaded, and every screen has measured and been drawn at its own size. Before, it waited only for the painted frame. That frame now arrives with the server's markup, drawn at its smallest until the screen measures, so a slow CI runner read a 14-column frame. Nothing a user installs is touched.
