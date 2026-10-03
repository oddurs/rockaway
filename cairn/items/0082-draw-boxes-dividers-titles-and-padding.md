---
id: 328a8cbc-6e07-4121-a5eb-b9c4fc336a84
title: Draw boxes, dividers, titles and padding
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 2d0d18d8-eb05-41a4-b84a-ef62220742a4
- cf6c0dcd-9b9d-4a74-be7b-cefe99ff86d0
- 75d45402-c09b-44eb-a1a1-e363af1afe27
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
