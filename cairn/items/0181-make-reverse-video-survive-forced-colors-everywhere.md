---
id: 181
uid: 84f8a449-8b34-4adf-a614-d5e73b4c911b
title: Make reverse video survive forced colors everywhere
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] Reverse video in forced colors swaps CanvasText and Canvas, for every component and for painted reverse cells
- [x] A forced-colors story for Button fill, Button pressed and a painted reverse run, each failing without the fix
- [x] `docs/concept.md` states the rule: reverse means an element's own figure and ground swapped

## 2026-10-03

The bug was two bugs. First, forced-colors.css mapped bg.inverse and fg.on-inverse to Canvas and CanvasText, so nothing reversed; they are now CanvasText and Canvas. Second, under forced-color-adjust: auto Chromium paints a Canvas-coloured backplate behind every line of text, so even correctly swapped colours put Canvas words on a Canvas plate and the words vanished. Computed styles cannot see that, which is how List's forced-colors story in 0133 passed while its selected rows' text was invisible. Screenshots showed it. Reversed elements now opt out: [data-attrs~=reverse], Button fill and pressed, Link pressed and List's selected row, listed in forced-colors.css. Button's rules live there because 0131 owns button.css.

## 2026-10-03

Foundations/Forced colors > Reverse video checks the pair, computed colours, and pixels (share of figure colour above 0.5 and of canvas colour above 0.02 in each element's screenshot) for Button fill, pressed Button, pressed fill reversing back, pressed Link (LinkText figure), a painted reverse run and a selected List row. With the opt-out removed, all five reversed subjects fail the pixel check, and continuity flags the painted run as a stripe. With the pair reverted, the story fails on the pair. A future reversing component must add its selector to the opt-out list in forced-colors.css; nothing enforces that yet.

## Result

Reverse video survives forced colors: the inverse pair is CanvasText behind Canvas, and every reversed element opts out of forced-color-adjust so the text backplate cannot hide its words. Checked in pixels.
