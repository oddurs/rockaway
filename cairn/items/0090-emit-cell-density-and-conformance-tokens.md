---
id: 90
title: Emit cell, density and conformance tokens
type: feature
status: done
milestone: retheme
assignee: Oddur Sigurdsson
depends_on:
- 74
- 75
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [x] `cell.width`, `cell.height` and `cell.ratio`, derived from font metrics in rem
- [x] Density rows: dense, normal, airy and touch, as a runtime context like today's density
- [x] `touch` is selected by `pointer: coarse` and can be forced
- [x] `conformance` is a token, so a screenshot can say which level it was built at

## 2026-09-23

DTCG dimensions are px, em and rem only, so `ch` and `lh` — the two units that actually mean a cell — cannot be written as dimension tokens. Space is therefore a count of cells (a number), and the CSS layer multiplies by the cell. That turned out better than the alternative: one count serves both directions, because across is ch and down is lh. Density renamed to dense/normal/airy/touch, with touch exactly twice dense, which is how a one-row control reaches a 44px target without a coordinate moving.
