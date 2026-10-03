---
id: 211
uid: 1cf34716-2f27-434e-949d-018574b161a8
title: List rows stay on the grid at dense after keyboard navigation
type: bug
status: backlog
milestone: primitives
depends_on:
- 133
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## What happens

In List's Disabled story at `dense`, after keyboard navigation, rows sit at
y = 15, 31 and 47px in 16px cells. It shows only once Screen remeasures (0199).
QA carries it as the known entry `list-dense-offset`.

## Acceptance criteria

- [ ] Rows land on whole cells at every density after keyboard navigation
- [ ] The `list-dense-offset` known entry is removed
