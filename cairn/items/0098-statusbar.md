---
id: 98
title: StatusBar
type: component
status: backlog
milestone: primitives
depends_on:
- 86
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: components
effort: m
---

## Purpose

The bar every TUI has: mode, context, position, and what the keys do.

## Acceptance criteria

- [ ] Segments that truncate by priority when the screen narrows, never wrap
- [ ] Reverse video for the active segment, with the contrast gate applied both ways
- [ ] Announced as a status region, not read on every change

## TUI criteria (added by the pivot, cairn 0076)

- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
