---
id: 101
title: Progress
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

Progress, spinner and sparkline: the three ways a terminal shows time passing.

## Acceptance criteria

- [ ] Block glyphs for progress, braille frames for the spinner, block eighths for the sparkline
- [ ] Frames advance on a tick from the motion tokens, and stop entirely on reduced motion
- [ ] Determinate and indeterminate both announce correctly

## TUI criteria (added by the pivot, cairn 0076)

- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
