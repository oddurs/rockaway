---
id: 89
title: Generate the ANSI 16 palette in OKLCH
type: feature
status: done
milestone: retheme
assignee: Oddur Sigurdsson
depends_on:
- 75
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: tokens
effort: l
---

## Acceptance criteria

- [x] Sixteen colours — eight plus their bright pair — generated from the theme inputs, not hand-picked
- [x] The semantic tier maps onto them: roles keep their names, values become palette slots
- [x] The contrast gate passes for every pair, in both modes, including reverse video checked both ways round
- [x] A palette can be imported from a terminal theme and validated against the same gate
- [x] Ink, Phosphor and Ice ship beside the default

## 2026-09-23

The sixteen are not role-symmetric — black is dark in both modes — so a semantic tier written once cannot alias them for a quiet background. Hence the role slots (background, surface, subtle, hover, active, foreground, muted, faint, three borders, cursor, selection, and a tint per intent), which the terminal export simply leaves out. On a light background the bright pair is darker rather than lighter, because it has to stay readable on the page. Found while wiring it up: the Terrazzo mode blocks still included palette.**, so a dark island stopped applying the moment the group was renamed; the nested-island test caught it.
