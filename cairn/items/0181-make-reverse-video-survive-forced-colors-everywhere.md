---
id: 181
uid: 84f8a449-8b34-4adf-a614-d5e73b4c911b
title: Make reverse video survive forced colors everywhere
type: bug
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: css
effort: s
---

## What happens

`forced-colors.css` maps `bg.inverse` and `fg.on-inverse` both to Canvas, so
anything reversed with that pair vanishes in forced colors: Button's fill and
pressed states, and painted cells carrying `data-attrs="reverse"`. Found by the
List engineer (0133), who fixed List by swapping its own figure and ground.

## Acceptance criteria

- [ ] Reverse video in forced colors swaps CanvasText and Canvas, for every component and for painted reverse cells
- [ ] A forced-colors story for Button fill, Button pressed and a painted reverse run, each failing without the fix
- [ ] `docs/concept.md` states the rule: reverse means an element's own figure and ground swapped
