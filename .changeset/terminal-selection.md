---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `watchSelection`: text selection drawn as a terminal draws it, in whole cells a whole row tall, with no stripes between rows. A browser highlights only each line's text, as tall as the font, so a selection of several lines is striped wherever the line box is taller, and in Firefox and WebKit even a painted screen's rows are. Call it once, as you call `watchOverflowMarks`: it paints a row of the theme's selection colour over each selected line, blended so the text keeps its own colour, and turns the browser's own highlight transparent while it runs. The selection is still the browser's, so copying and reading it are unchanged. With no script the browser's highlight shows, and under forced colours it does nothing, leaving the reader's Highlight. `selectionLines` returns the rows it would paint.
