---
id: 178
uid: 7920892d-944d-420c-9523-699672452d39
title: 'Make border.default a boundary you can see: 3:1 against every ground'
type: bug
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: tokens
effort: s
---

## What happens

`border.default` is oklch 90% on a 98.5% ground — a web hairline colour, about
1.2:1. The token describes itself as "the ordinary edge: frames, dividers,
tables", and Panes, Dialog, Popover, Table and Tabs all consume it. Drawn as a
type-weight stroke on the grid, a frame in it nearly disappears. Found by the
polish engineer on 0129, from screenshots.

On a character grid the frame is the only boundary a pane has. It is a user
interface boundary in the sense of WCAG 1.4.11, and it must meet 3:1.

## What should happen

`border.default` meets 3:1 against `bg.page`, `bg.surface` and `bg.subtle`, in
both modes and every theme, and the contrast gate holds it there.
`border.subtle` stays available for separation that is genuinely decorative,
and says so in its description.

## Acceptance criteria

- [ ] `border.default` against every ground it is drawn on is a declared non-text pair, gated at 3:1, in sRGB and p3 (0163)
- [ ] The generator meets it in both modes and every preset, with the margin reported
- [ ] `border.subtle`'s description says it is for decorative separation only, and no component draws a boundary in it
- [ ] Frame, Divider and the List scrollbar track are screenshotted before and after at normal density, light and dark
