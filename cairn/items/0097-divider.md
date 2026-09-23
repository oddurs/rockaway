---
id: 97
title: Divider
type: component
status: backlog
milestone: primitives
depends_on:
- 86
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: components
effort: s
---

## Purpose

A rule across a frame or between panes, joining the sides it meets.

## Acceptance criteria

- [ ] Horizontal and vertical, with weight from the border set
- [ ] Joins its container through the junction model, never by drawing its own corners
- [ ] `role="separator"` with an accessible orientation

## TUI criteria (added by the pivot, cairn 0076)

- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
