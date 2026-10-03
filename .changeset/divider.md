---
'@rockaway/react': minor
---

Add `Divider`, a rule across a frame or between panes. `drawRule` adds edge weights and nothing else, so where a rule meets a border the junction table resolves the seam into `├`, `┤`, `┬` or `┴`; `Frame`'s `dividers` prop calls the same function. An open rule ends in `╶` and `╴`, and `ends="joined"` gives a standalone divider tees at both ends. `Divider` is `role="separator"` with its orientation; a rule drawn by `Frame`'s `dividers` prop is chrome and announces nothing.
