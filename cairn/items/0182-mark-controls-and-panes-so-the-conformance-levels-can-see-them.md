---
id: 182
uid: e1677a82-905e-439a-88b0-07e25faefe20
title: Mark controls and panes so the conformance levels can see them
type: feature
status: backlog
milestone: primitives
depends_on:
- 123
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: s
---

## Problem

0123 gives `standard` half a cell inside `[data-rk-control]` and checks only
panes at `loose` (`[data-rk-pane]`), but no component sets either attribute, so
both rules touch test cases only.

## Acceptance criteria

- [ ] Every control sets `data-rk-control` and every pane-like container sets `data-rk-pane`, and the metadata says which
- [ ] A story per level shows a real component held to it
- [ ] The recipe (0134) says when a component is a control or a pane
