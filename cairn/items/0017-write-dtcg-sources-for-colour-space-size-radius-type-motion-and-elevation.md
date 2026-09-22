---
id: 17
title: Write DTCG sources for colour, space, size, radius, type, motion and elevation
type: feature
status: backlog
milestone: tokens
depends_on:
- 16
- 62
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: l
---

## Acceptance criteria

- [ ] Every category exists as DTCG 2025.10 JSON, and validates
- [ ] Reference tier holds raw values only; nothing references upward
- [ ] Type scale and spacing are generated from ratios, not listed by hand
- [ ] Every value on the concept canvas's Default board is reproduced, or the difference is recorded with its reason

## 2026-09-22

Scope narrowed: these sources are written by the theme generator (#0062), not by hand. This item is now about reviewing the generated output per category and deciding what stays hand-authored (motion, if anything).
