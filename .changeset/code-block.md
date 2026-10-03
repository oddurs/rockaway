---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `CodeBlock` and `CodeSnapshot`.

- **`CodeBlock`** puts code in a painted frame: a title in the top edge, line numbers behind a rule that joins the frame, and a copy button that copies exactly the code and says so once to a reader.
  - The code is real text. Given `tokens` from a highlighter, each token carries its `rk-syntax-<role>` class.
  - A long line scrolls sideways inside the block and comes to rest on whole cells.
  - Box drawing inside code is drawn by the cell, not the font. `codeRuns` is the split that does it, for anything else that puts box drawing in text.
- **`CodeSnapshot`** shows a text snapshot, read back into cells and painted through the cell renderer, so its lines meet at every density. It is a figure, named by `label` in words.
- **Buffer functions:** `codeBlockBuffer`, `codeBlockText` and `snapshotBuffer` draw the same things as text.
- **`@rockaway/css`** ships `code-block.css`.

`Screen` now also takes a function as its children, which it calls with the size it drew at, in cells.
