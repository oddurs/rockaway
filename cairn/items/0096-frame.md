---
id: 96
title: Frame
type: component
status: backlog
milestone: primitives
depends_on:
- 86
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: components
effort: m
---

## Purpose

The box every other component is drawn inside: a border set, a title in the
top edge, padding in cells, and dividers that join their sides.

## Acceptance criteria

- [ ] Any border set, with the junction model resolving every seam
- [ ] A title truncates with the border, never past it
- [ ] Glyph and rule painters both render it identically, measured in cells
- [ ] `aria-hidden` chrome; the region's accessible name comes from its title text, not its glyphs

## TUI criteria (added by the pivot, cairn 0076)

- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
