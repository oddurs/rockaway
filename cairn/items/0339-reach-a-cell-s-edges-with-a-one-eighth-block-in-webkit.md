---
id: 339
uid: 6c623748-f0ef-44d6-86a2-f28868cc0454
title: Reach a cell's edges with a one-eighth block in WebKit
type: bug
status: backlog
milestone: primitives
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: css
effort: s
---

## What happens

In WebKit, at a 16.4px font with the screen 0.13px or 0.41px in from a pixel (which offsets varies between macOS and Linux), the right one-eighth block `▕` is drawn short of its cell: Continuity's "Marks set in from an edge" finds its north, east and south strokes stopping short (7,1 in the 16.4 / 0.13 grid). Chromium and Firefox draw it to the edges. It surfaced when the stories began running in WebKit (#162). The story allows only this block's gap in WebKit at 16.4px, and holds every other mark.

## What should happen

The block reaches its cell's north, east and south edges in every engine, at every size and offset the story walks.

## Acceptance criteria

- [ ] The cause is named in a note: how shapes.css places a partial block, and what WebKit rounds differently.
- [ ] The story's WebKit exception comes off, and it passes in all three engines.
