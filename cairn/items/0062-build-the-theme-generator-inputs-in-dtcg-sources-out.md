---
id: 62
title: 'Build the theme generator: inputs in, DTCG sources out'
type: feature
status: backlog
milestone: tokens
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

- [ ] `themes/default.json` holds the five theme inputs and nothing else
- [ ] Output is DTCG 2025.10: OKLCH colour objects, dimension objects, aliases between tiers
- [ ] `tokens.resolver.json` with `mode` (light, dark) and `density` (compact, regular, comfortable) modifiers
- [ ] Generated files are committed; CI fails if they are stale
- [ ] Unit tests pin the derivation rules (a changed rule is a visible diff)
- [ ] Every value on the concept canvas's Default board is reproduced
