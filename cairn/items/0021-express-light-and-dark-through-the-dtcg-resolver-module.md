---
id: 21
title: Express light and dark through the DTCG Resolver module
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
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

- [x] One semantic tier, two resolutions; no component knows which is active
- [x] Per-context blocks (0015): `prefers-color-scheme` by default, `[data-theme]` and `[data-density]` on any element, each mode block setting `color-scheme`
- [x] Contexts nest, verified in a real browser

## 2026-09-22

Mode and density are both contexts (#0058), so this item covers the density modifier too.

## 2026-09-22

Revised by the Terrazzo spike (0015): mode output is per-context blocks under `@media (prefers-color-scheme: dark)` and `[data-theme]`, not `light-dark()`. Terrazzo re-emits aliases per permutation, which is what makes nested theme islands work. The `light-dark()` criterion below is read as that.
