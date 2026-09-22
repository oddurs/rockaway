---
id: 62
title: 'Build the theme generator: inputs in, DTCG sources out'
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
depends_on:
- 16
- 58
- 59
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: l
---

## Problem

The derivation rules are in a canvas prototype. They need to be the single
place a token value comes from.

## Proposal

`packages/tokens/src/generate.ts` reads a theme file (the five theme inputs)
and writes DTCG 2025.10 JSON: a reference tier, a semantic tier per mode, and a
density set per context, plus the resolver document that ties them together.

## Acceptance criteria

- [x] `themes/default.json` holds the five theme inputs and nothing else
- [x] Output is DTCG 2025.10: OKLCH colour objects and dimension objects
- [x] `rockaway.resolver.json` with `mode` (light, dark) and `density` (compact, regular, comfortable) modifiers
- [x] Generated files are committed; CI fails if they are stale
- [x] Unit tests pin the derivation rules (a changed rule is a visible diff)

## 2026-09-22

Scoped on 2026-09-22 so each item is one change: this item is the pipeline (inputs, DTCG writer, resolver, staleness check) with palettes (0018), density contexts and font primitives. Semantic colours are 0019; type scale, radius, shadows, motion and the canvas comparison are 0017. The aliases criterion moved to 0019 and the canvas criterion to 0017.
