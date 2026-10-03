---
id: 160
uid: e6044f52-4664-40f6-86ff-9809f9d8c74f
title: Clip screenshot() to what its scroll container shows
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] Text clipped by an ancestor with `overflow` other than `visible` is left out of the screenshot
- [x] A scrolled List's screenshot shows exactly the visible rows, before and after scrolling, as a checked-in snapshot
- [x] The workaround in the `Foundations/Theme glyphs` story is removed

## 2026-10-03

Each text node is clipped by the intersection of every ancestor, up to the screen, whose computed overflow-x or overflow-y is not visible. The clip is the padding box (clientLeft/Top, clientWidth/Height), converted to cells by rounding. A row outside it is dropped. Columns outside it are not drawn, and a wide character is drawn whole or not at all. VisuallyHidden text (1px, overflow hidden) now falls out naturally. Against the old screenshot.ts the three affected stories fail.

## 2026-10-03

Found: List does not count its rows when total is omitted. The scroll effect reads scrollHeight once, keyed on the cell size, before React Aria's collection has rendered, so the scrollbar shows a full thumb for a list that scrolls. The Theme glyphs story and the new Grid/Screenshot story pass total explicitly. This is legitimate use of the prop, not the old three-of-six workaround, but List needs a fix (reported as a follow-up).

## Result

screenshot() draws text only inside every overflow-clipping ancestor's padding box, so scrolled-out rows and overlong labels no longer write over the frame. Grid/Screenshot 'Shows only what a scroll container shows' snapshots a list before and after scrolling.
