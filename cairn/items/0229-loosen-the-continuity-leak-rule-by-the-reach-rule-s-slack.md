---
id: 229
uid: ef1f51cb-8411-4286-bcea-8180b3e7871f
title: Loosen the continuity leak rule by the reach rule's slack
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## What happens

At 200% zoom Chrome snaps backgrounds to whole CSS pixels, so ink reaching a
cell edge on a half pixel spills one device pixel into the next cell, and the
leak check fails it beside a cell with no line there. Found while widening the
continuity fixtures (0210).

## Acceptance criteria

- [x] The leak rule allows a neighbour's edge ink within the same half-CSS-pixel slack the reach rule allows, with a fixture at 2×

## 2026-10-03

Leaks are decided once every cell is known: beside a neighbour whose ink reaches the shared edge, the leak is read on the innermost line of the slack. The same spill made false steps (a ▄ under a ▙ took the spilt pixel at the top of its east edge), so where a neighbour reaches an edge a cell does not, the spans across its other edges drop their ends within the slack. At 1x the slack has no lines and nothing changes. Fixture: Grid/Continuity 'Edge ink beside an edge with none', ▂ over ▄ and ▙ before ▗ at nine sizes and offsets; 7 leaks and 3 steps at 15.3px, 0.69px in at 2x under the old rule, a pass now, and a ▄ filled to its top still caught. #151.
