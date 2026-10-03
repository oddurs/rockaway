---
id: 159
uid: 60b382cd-ca83-4be5-aaf1-2de6e293b2a0
title: Follow custom properties in the geometry check
type: chore
status: backlog
milestone: primitives
depends_on:
- 32
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

The geometry check (0032) fails any variant or state rule that sets a size,
padding, margin or inset. A rule can still set a custom property — say
`--rk-x-pad` — that a base rule uses for padding, and the check will not see it.

## Acceptance criteria

- [ ] The check traces `var()` in every geometric declaration back to the custom properties variant and state rules set, and fails on those too
- [ ] A fixture proves it: a state rule that changes padding through a custom property fails
- [ ] Declared exceptions still work and are still listed in the snapshot
