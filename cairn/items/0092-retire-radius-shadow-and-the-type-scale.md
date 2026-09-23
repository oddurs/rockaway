---
id: 92
title: Retire radius, shadow and the type scale
type: chore
status: backlog
milestone: retheme
depends_on:
- 75
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [ ] The generator no longer emits them, and the tests that pinned them go with their reasons recorded
- [ ] The semantic tier keeps its names, so component CSS still resolves
- [ ] A changeset marks the major break, with a migration note saying what to use instead
