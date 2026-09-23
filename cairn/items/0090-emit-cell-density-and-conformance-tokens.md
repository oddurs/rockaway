---
id: 90
title: Emit cell, density and conformance tokens
type: feature
status: backlog
milestone: retheme
depends_on:
- 74
- 75
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [ ] `cell.width`, `cell.height` and `cell.ratio`, derived from font metrics in rem
- [ ] Density rows: dense, normal, airy and touch, as a runtime context like today's density
- [ ] `touch` is selected by `pointer: coarse` and can be forced
- [ ] `conformance` is a token, so a screenshot can say which level it was built at
