---
id: 82
title: Draw boxes, dividers, titles and padding
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 79
- 80
- 81
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Acceptance criteria

- [x] A box of any border set, with padding in cells and an optional title set into its top edge
- [x] A title truncates with the border, never past it, and reads correctly in the text painter
- [x] Dividers inside a box join its sides (`├`, `┤`) through the junction model
- [x] A frame is drawn from a solved layout, so a box never disagrees with the space it was given

## 2026-09-22

The shared-edge criterion from 0079 is asserted here: two boxes overlapping on their common wall render one line with ┬ and ┴, because both write edges into the same cell and the junction model resolves it. End-aligned titles were a cell short of the right border; the test caught it.
