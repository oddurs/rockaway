---
id: 247
uid: b911c7c6-abc5-4b75-b7cc-db381b9a3775
title: Make the popover and modal border weights theme glyph tokens
type: feature
status: review
milestone: tokens
assignee: Oddur Sigurdsson
claimed: 2026-10-03
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tokens
effort: s
---

## Purpose

Popover and Dialog hard-code their frame weights (heavy, double). Add Glyphs.weight.{emphasis, raised, modal}, defaulting to heavy, heavy and double, ASCII under an ASCII theme, so a theme can change them. Proposed by the fields engineer in 0128; the tokens engineer is building it.

## 2026-10-03

Glyphs.weight.{emphasis, raised, modal} names the border set a frame stands out in, by reason: emphasis (a focused or invalid field) heavy, raised (popover, menu, select list) heavy, modal (dialog) double; all ascii under an ASCII theme, where bold carries the difference. A theme may set any in the optional 'weights' input; parseTheme keeps them in the theme's repertoire (a Unicode theme cannot draw a weight in ascii, nor the reverse), because the border set decides the repertoire (0091). The CSS gains --rk-glyph-border-{emphasis,raised,modal}-* beside current, written from the same object, and the glyph test checks the tokens against Glyphs for every theme. FieldFrame now draws glyphs.weight.emphasis in place of its own heavier() (identical output in every shipped theme; fields agreed, and keeps the ASCII bold rule on #117). overlay.pure.ts's setOf() on #149 is the fields/overlays engineer's to switch to weight.raised / weight.modal once this lands; I did not touch it while #149 is queued.
