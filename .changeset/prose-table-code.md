---
'@rockaway/css': patch
---

Code in a sized prose table breaks only at spaces (cairn 0106).

A table whose columns a pipeline sized in cells could still be squeezed by the browser, which then broke `--rk-fg-on-inverse` after a hyphen and left the column narrower than its widest word. Code in those columns no longer wraps, so a column is never narrower than the word it was sized for.
