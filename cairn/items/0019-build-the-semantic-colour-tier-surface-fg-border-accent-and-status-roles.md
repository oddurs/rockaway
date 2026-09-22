---
id: 19
title: 'Build the semantic colour tier: surface, fg, border, accent and status roles'
type: feature
status: backlog
milestone: tokens
depends_on:
- 17
- 18
- 58
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [ ] Semantic colour tokens are aliases to palette steps, written once for both modes
- [ ] Roles named by intent (`surface.raised`, `fg.muted`, `border.focus`), never by hue
- [ ] Interactive states come from relative colour syntax, not extra tokens where possible

## 2026-09-22

Roles proven on the canvas: bg, surface, subtle, hover, border, strong, muted, fg, accent, on-accent, accent-subtle, accent-text, inverse, on-inverse, plus per status tone bg, border, fg, solid.
