---
"@rockaway/react": minor
"@rockaway/css": minor
---

Add `surface` prop to Panes, Pane, and Frame; add `gutter` prop to Screen.

- Panes' panes and Frame take `surface`: `sunken`, `base` (default), `raised`, `overlay`
- Each reads `--rk-bg-surface-*` tokens (to be added by tokens engineer)
- Screen takes `gutter` in cells as margin around the frame
- Forced colours collapse surfaces to Canvas
- CSS added for panes and frame surfaces
