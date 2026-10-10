---
'@rockaway/react': minor
---

`TextField` takes `inputRef`, a ref to the text box itself: its `<input>`, or its `<textarea>` when `multiline`. An app can then focus the box, select its text or read its caret. An object ref or a callback both work, and the field keeps its own ref beside the caller's, so its text stays on whole cells.
