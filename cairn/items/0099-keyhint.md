---
id: 99
title: KeyHint
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

`^S save` — the footer hint and the inline shortcut, which is how a TUI teaches
itself.

## Acceptance criteria

- [ ] Renders the platform's modifier glyphs, and says them properly to a screen reader
- [ ] Sits inside a `<kbd>`, and never becomes the accessible name of the thing it labels

## TUI criteria (added by the pivot, cairn 0076)

- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
