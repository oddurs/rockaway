---
id: 216
uid: 2392dd7e-b684-40eb-95dc-d581ac975222
title: Keep a focused tab in view under manual activation
type: bug
status: backlog
milestone: primitives
depends_on:
- 40
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## What happens

When tabs scroll, the window is computed from the selected tab only, so under
manual activation a focused but unselected tab can sit out of view.

## Acceptance criteria

- [ ] The focused tab is always in view, with a keyboard story under manual activation
