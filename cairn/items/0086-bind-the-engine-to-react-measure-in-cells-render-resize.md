---
id: 86
title: 'Bind the engine to React: measure in cells, render, resize'
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 74
- 85
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: l
---

## Acceptance criteria

- [x] A `Screen` measures its container in cells from the font metrics, not from a guess
- [x] Server rendering produces a frame without a browser, and hydration does not move a cell
- [x] Resizing recomputes through one `ResizeObserver` per screen, batched, with no layout thrash
- [x] Zoom and a font-size change reflow by cell count
- [x] Nothing in the React layer knows how a border is drawn
