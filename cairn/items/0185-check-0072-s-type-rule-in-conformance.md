---
id: 185
uid: 6597a325-6264-4fae-8bd3-3d66ac10dbcf
title: Check 0072's type rule in conformance
type: feature
status: backlog
milestone: primitives
depends_on:
- 123
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

`strict` means one type size; `standard` one size plus a display size on a
two-cell row (0072). The check measures boxes and painters, not type.

## Acceptance criteria

- [ ] Conformance reports text in a size the level does not allow
- [ ] A story fails at `strict` with a larger heading and passes at `standard` on a two-cell row
