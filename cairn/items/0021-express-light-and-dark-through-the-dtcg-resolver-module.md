---
id: 21
title: Express light and dark through the DTCG Resolver module
type: feature
status: backlog
milestone: tokens
depends_on:
- 19
- 20
- 62
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [ ] One semantic tier, two resolutions; no component knows which is active
- [ ] Output uses `light-dark()` with `color-scheme`, plus an explicit `[data-theme]` override

## 2026-09-22

Mode and density are both contexts (#0058), so this item covers the density modifier too.

## 2026-09-22

Revised by the Terrazzo spike (0015): mode output is per-context blocks under `@media (prefers-color-scheme: dark)` and `[data-theme]`, not `light-dark()`. Terrazzo re-emits aliases per permutation, which is what makes nested theme islands work. The `light-dark()` criterion below is read as that.
