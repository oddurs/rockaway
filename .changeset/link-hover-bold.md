---
'@rockaway/css': patch
'@rockaway/react': patch
---

Draw a hovered link in bold, never with a double underline, which a terminal cannot draw (cairn 0209). Link and links in `.rk-prose` are underlined at rest, so hover is the bold attribute instead; a bold cell is no wider in a monospace face, and the current page stays distinct by its cursor mark and body colour. `linkBuffer` draws a hovered link bold.
