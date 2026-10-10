---
id: 331
uid: 4def0fff-6fbb-44f2-b21f-ac11bfc52bbc
title: Draw a Picture in braille or half blocks, as an optional look
type: feature
status: backlog
milestone: primitives
created: 2026-10-10
updated: 2026-10-10
priority: p3
layer: components
effort: m
---

## Purpose

Picture (0320) shows a real image, the default the owner chose in 0311. As an optional look, the same picture drawn in the cell grid: braille (2×4 dots a cell) or half blocks (`▀` with a foreground and a background colour, two pixels a cell). The image is sampled on the client into a canvas at cols × rows × the look's resolution and drawn as runs. That needs a cross-origin image to allow it, and colours the buffer's styles may not carry today.

## Acceptance criteria

- [ ] `look="braille"` and `look="blocks"` on Picture, the real image the default.
- [ ] Drawn by the cell renderer, the same cells in every engine; the alt text unchanged.
- [ ] Falls back to the real image when the pixels cannot be read (a tainted canvas), and says so in a note.
