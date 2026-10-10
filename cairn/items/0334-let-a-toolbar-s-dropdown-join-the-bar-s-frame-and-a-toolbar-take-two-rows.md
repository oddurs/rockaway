---
id: 334
uid: f4404f19-101c-4c85-9828-e5135b6f07aa
title: Let a toolbar's dropdown join the bar's frame, and a toolbar take two rows
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

The rest of 0317 and 0318. A toolbar's dropdown should open on a whole-cell edge so its frame joins the bar: when the bar sits in a frame, the dropdown's top edge is the frame's line, with tees where they meet. A toolbar may also take two rows when it has two groups of commands that should not fold.

## Acceptance criteria

- [ ] A Menu opened from a ToolbarButton sits on the row under the bar, and its frame joins the frame around the bar where they touch, through the junction table.
- [ ] `rows={2}` on Toolbar lays its groups out over two rows and folds only past both.
