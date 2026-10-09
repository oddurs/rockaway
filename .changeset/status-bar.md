---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `StatusBar`, with `StatusSegment` and `StatusMessage`: one row at the bottom of a screen for the mode, the context, the position and what the keys do, plus the message line a TUI has instead of toasts. Segments sit at the start, the centre or the end. They are laid out in whole cells by `fitStatus`. When the row is too narrow, the lowest priority is cut first, ending in the theme's ellipsis, and then hidden, so the bar is one row at every width. `variant="mode"` is reverse video, and stays reversed in forced colors. The message slot is a polite status region, always present. A message shows for `duration` milliseconds, is announced once, and is replaced by the next. A segment whose content is text is placed at the text's width from the first render, so a bar rendered on a server shows its words with no script; so is a segment holding a `KeyHint` with a text label, whose width `keyHintCells` gives from its props; a segment holding anything else waits, hidden, until the page has measured it. `statusBarBuffer` draws the same bar as text. `@rockaway/css` ships `status-bar.css`.

`Screen` now also takes a function as its children, which it calls with the size it drew at, in cells.
