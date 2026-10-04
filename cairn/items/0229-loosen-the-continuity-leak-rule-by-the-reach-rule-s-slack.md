---
id: 229
uid: ef1f51cb-8411-4286-bcea-8180b3e7871f
title: Loosen the continuity leak rule by the reach rule's slack
type: bug
status: backlog
milestone: primitives
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
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

- [ ] The leak rule allows a neighbour's edge ink within the same half-CSS-pixel slack the reach rule allows, with a fixture at 2×
