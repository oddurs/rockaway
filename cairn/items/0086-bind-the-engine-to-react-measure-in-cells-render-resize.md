---
id: 86
title: 'Bind the engine to React: measure in cells, render, resize'
type: feature
status: backlog
milestone: grid
depends_on:
- 74
- 85
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: grid
effort: l
---

## Acceptance criteria

- [ ] A `Screen` measures its container in cells from the font metrics, not from a guess
- [ ] Server rendering produces a frame without a browser, and hydration does not move a cell
- [ ] Resizing recomputes through one `ResizeObserver` per screen, batched, with no layout thrash
- [ ] Zoom and a font-size change reflow by cell count
- [ ] Nothing in the React layer knows how a border is drawn
