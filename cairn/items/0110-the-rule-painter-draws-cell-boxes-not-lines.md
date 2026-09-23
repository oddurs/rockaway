---
id: 110
title: The rule painter draws cell boxes, not lines
type: bug
status: done
milestone: grid
assignee: Oddur Sigurdsson
created: 2026-09-23
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: grid
effort: s
---

## What happens

Each cell draws borders on its own box, so a horizontal line comes out as a
tick on every cell boundary rather than a continuous line, and a box reads as
a dashed rectangle.

## What should happen

An edge weight means a stroke from the centre of the cell toward that side, so
adjacent cells join into one line and corners meet.

## Reproduction

1. Open Grid/Painters in the workbench and compare the two panels.

## Acceptance criteria

- [x] A run of cells with the same edge draws one continuous line
- [x] Corners and junctions meet at the centre, like the glyphs do
- [x] The two painters still measure the same, in cells
- [x] Checked by eye, not only by structure
