---
id: 228
uid: d38fbf33-e1c5-4d3b-ad71-3853dc081e1f
title: Re-check cellsIn's snap at the new line boxes
type: chore
status: backlog
milestone: primitives
depends_on:
- 198
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: grid
effort: s
---

## Problem

`cellsIn` allows a 1/32px snap, chosen at the old line boxes. 0198 made them 1.5
and 2.75.

## Acceptance criteria

- [ ] A test measures boxes of whole cells at every density and both axes, and the snap holds
