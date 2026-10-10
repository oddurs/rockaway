---
'@rockaway/react': minor
---

Add `@rockaway/react/copy`: a rendered screen, read back off the page as text or as ANSI. `readScreen` reads the painted chrome and the elements over it into a `Buffer`, each character in its cell with the colours it is drawn in. `screenText` gives that as text. `screenAnsi` gives it as escape sequences through the engine's `toAnsi`, with `screenPalette` mapping the page's own colours to the terminal's: its ground and text are the terminal's default, the theme's sixteen are the sixteen, a ground of the text colour is reverse video, and anything else is truecolor, or the nearest at 256 or 16 colours.
