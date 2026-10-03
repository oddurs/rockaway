---
id: 213
uid: e2a7866e-f718-4d38-8125-60a20fd8de1e
title: Tolerate float error in cellsIn
type: bug
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: grid
effort: s
---

## What happens

In Firefox a forty-cell box measures 39 cells: 385.33331 / 9.63333374 =
39.999996, floored. #94 added a half-pixel tolerance to `cellsIn`; confirm it
covers this case, or use a fraction of a layout unit. Known entry
`firefox-cells-in` (0124).

## Acceptance criteria

- [ ] A box exactly n cells wide counts n cells in every engine
- [ ] The `firefox-cells-in` entry is removed
