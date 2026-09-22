---
id: 18
title: Generate the colour scales in OKLCH
type: feature
status: backlog
milestone: tokens
depends_on:
- 16
- 58
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Proposal

Scales come from a formula over lightness and chroma, so every hue has the same
perceptual steps and a new hue is one line.

## Acceptance criteria

- [ ] Neutral plus accent and status hues, 12 steps each
- [ ] Out-of-gamut values are clamped for sRGB, with P3 kept where available

## 2026-09-22

The recipe is settled in #0058. Neutral steps from the canvas: 0.98, 0.95, 0.90, 0.80, 0.65, 0.50, 0.35, 0.20. Accent steps: (0.95, 0.04), (0.87, 0.09), (0.76, 0.14), (0.64, 0.17), (0.52, 0.17), (0.44, 0.15), (0.34, 0.11).
