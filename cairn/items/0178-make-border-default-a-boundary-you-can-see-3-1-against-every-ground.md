---
id: 178
uid: 7920892d-944d-420c-9523-699672452d39
title: 'Make border.default a boundary you can see: 3:1 against every ground'
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] `border.default` against every ground it is drawn on is a declared non-text pair, gated at 3:1, in sRGB and p3 (0163)
- [x] The generator meets it in both modes and every preset, with the margin reported
- [x] `border.subtle`'s description says it is for decorative separation only, and no component draws a boundary in it
- [x] Frame, Divider and the List scrollbar track are screenshotted before and after at normal density, light and dark

## 2026-10-03

Fixed in the generator's ramp rather than by fitting: border goes 0.90 to 0.63 in light and 0.31 to 0.53 in dark, which gives 3.10 to 3.50:1 in light and 3.07 to 3.65:1 in dark, measured in all five views of the 0163 gate. The tightest is bg.subtle in each mode (+0.10 light, +0.07 dark). border-strong moves to 0.56 light and 0.60 dark, so a control's edge stays a step past the ordinary one. A test checks that no preset at any accent needs fitting for a border slot. importPalette now derives border at 40% of the way from background to foreground (it was 16%) and border-strong at 50% (45%), so imported themes start near the gate and do not lean on fitting (0052).

## 2026-10-03

Screenshots of Frame, Divider and the List scrollbar track at normal density, light and dark, before and after: /private/tmp/claude-501/-Users-oddurs-Code-design-sense/593c330f-315f-4f51-b4fd-efc3197ed542/scratchpad/borders/{before,after}-{light,dark}.png. They are the same image, because none of the three reads border.default yet: frame lines are drawn in the text colour and the track in fg.muted. Moving the frame onto border.default is the Frame polish engineer's change (0129), and that is where the difference will show.

## 2026-10-03

border.subtle: the only drawing in it is base.css's hr, a thematic break that is separation rather than any element's boundary, and the workbench reference tables' row rules. No component under packages/css/src/components or packages/react uses it.

## Result

border.default (and border.surface, which reads the same slot) is at least 3:1 against bg.page, bg.surface and bg.subtle in both modes and every preset. It is a declared non-text pair checked in every view of the 0163 gate. The tightest margin is +0.07, dark on bg.subtle. border-strong stays a step stronger. border.subtle is for decorative separation only.
