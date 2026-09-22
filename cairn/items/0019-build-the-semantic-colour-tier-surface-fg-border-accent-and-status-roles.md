---
id: 19
title: 'Build the semantic colour tier: surface, fg, border, accent and status roles'
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
depends_on:
- 18
- 58
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [x] Semantic colour tokens are aliases to palette steps, written once for both modes
- [x] Roles named by intent (`surface.raised`, `fg.muted`, `border.focus`), never by hue
- [x] Interactive states are palette steps (element 3 → 4 → 5, solid 9 → 10), not computed in CSS

## 2026-09-22

Roles proven on the canvas: bg, surface, subtle, hover, border, strong, muted, fg, accent, on-accent, accent-subtle, accent-text, inverse, on-inverse, plus per status tone bg, border, fg, solid.

## 2026-09-22

Criterion 3 reworded: it predates the step roles in 0016. Hover and active states are palette steps, so they are contrast-tested with everything else; relative colour syntax is kept for alpha derivations in component CSS (scrims, tinted shadows), where no step fits. Naming follows 0016: bg.surface rather than surface.raised.
