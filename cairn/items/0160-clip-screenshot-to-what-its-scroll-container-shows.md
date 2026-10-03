---
id: 160
uid: e6044f52-4664-40f6-86ff-9809f9d8c74f
title: Clip screenshot() to what its scroll container shows
type: bug
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: s
---

## What happens

`screenshot()` reads every text node inside a screen, including list rows
scrolled out of view, and writes them into the grid where they overwrite the
frame. Found by the tokens engineer (0119), who had to hold a story to exactly
three rows to work around it.

## What should happen

A text screenshot shows what a reader sees: text outside its nearest scroll
container's visible box is not drawn. Every collection test (List, Menu, Select,
Table, Tree, CommandPalette) depends on this being true.

## Acceptance criteria

- [ ] Text clipped by an ancestor with `overflow` other than `visible` is left out of the screenshot
- [ ] A scrolled List's screenshot shows exactly the visible rows, before and after scrolling, as a checked-in snapshot
- [ ] The workaround in the `Foundations/Theme glyphs` story is removed
