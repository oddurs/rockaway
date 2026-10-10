---
'@rockaway/react': minor
'@rockaway/css': minor
---

Panes' panes and Frame take a `surface`: `sunken`, `base`, `raised` or `overlay`. A frame paints its whole box, border cells included; a pane paints its content and padding, and the borders it shares stay the screen's. Each reads a `--rk-bg-surface-*` role, falling back to the roles a theme has today. Forced colours collapse every surface to Canvas. Screen takes a `gutter`, in whole cells, of empty margin around it. Padding was already whole cells, one across and none down by default.
