---
id: 177
uid: 01b26dca-479b-4f2e-8413-0635639a8ff9
title: Let checkContinuity check shapes drawn outside a painted layer
type: feature
status: backlog
milestone: site
depends_on:
- 117
- 143
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

Prose rules (0143) draw with pseudo-elements, which have no box the continuity
check can find. A descriptor would let a caller say where a shape is.

## Acceptance criteria

- [ ] `checkContinuity` accepts extra shapes (`{ element, shape, cells }`) and checks them like painted cells
- [ ] The site's prose rules are checked with it
