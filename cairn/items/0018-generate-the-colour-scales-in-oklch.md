---
id: 18
title: Generate the colour scales in OKLCH
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
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

- [x] Neutral plus accent and status hues, 12 steps each
- [x] Out-of-gamut values are clamped for sRGB, with P3 kept where available

## 2026-09-22

The recipe is settled in #0058. Neutral steps from the canvas: 0.98, 0.95, 0.90, 0.80, 0.65, 0.50, 0.35, 0.20. Accent steps: (0.95, 0.04), (0.87, 0.09), (0.76, 0.14), (0.64, 0.17), (0.52, 0.17), (0.44, 0.15), (0.34, 0.11).

## 2026-09-22

Superseded the canvas steps above. The palettes follow the step roles in 0016 and are tested for every accent hue in 15° steps, all three temperatures and both modes: text 12 at 7:1, text 11 at 4.5:1, text on solids at 4.5:1, and step 8 and 9 at 3:1 against both surfaces. The concept's input border (L 0.80) failed WCAG 1.4.11 at about 1.8:1; step 8 is now the control border at L 0.62 (light) / 0.52 (dark). Values are left unmapped on purpose: sRGB mapping happens at build time, where Terrazzo emits the mapped value and keeps the original for P3 (0015). toSrgbGamut exists so the contrast checks judge what an sRGB screen shows.
