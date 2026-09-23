---
id: 102
title: CommandPalette
type: component
status: backlog
milestone: primitives
depends_on:
- 86
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: components
effort: l
---

## Purpose

`⌘K`. The front door of a keyboard-first interface, and the thing the site is
judged on.

## Acceptance criteria

- [ ] Fuzzy match with the matched cells marked by attribute, not only colour
- [ ] Opens over any screen, traps focus, restores it, and closes on Escape
- [ ] Works on touch as a sheet at touch density
- [ ] Empty, loading and no-match states are all drawn, not improvised

## TUI criteria (added by the pivot, cairn 0076)

- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
