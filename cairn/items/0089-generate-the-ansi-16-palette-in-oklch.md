---
id: 89
title: Generate the ANSI 16 palette in OKLCH
type: feature
status: backlog
milestone: retheme
depends_on:
- 75
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: l
---

## Acceptance criteria

- [ ] Sixteen colours — eight plus their bright pair — generated from the theme inputs, not hand-picked
- [ ] The semantic tier maps onto them: roles keep their names, values become palette slots
- [ ] The contrast gate passes for every pair, in both modes, including reverse video checked both ways round
- [ ] A palette can be imported from a terminal theme and validated against the same gate
- [ ] Ink, Phosphor and Ice ship beside the default
