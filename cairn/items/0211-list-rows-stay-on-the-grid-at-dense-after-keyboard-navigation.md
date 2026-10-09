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
updated: 2026-10-09
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

## 2026-10-09

Settled by List's virtualisation (0115, #150): the virtualiser places every row at a whole multiple of the measured cell, and List keeps its top row itself, so after keyboard navigation at dense the rows are on the grid. The full workbench run on #150 reported list-dense-offset as no longer failing, and #150 removes the entry. Close when #150 lands.
