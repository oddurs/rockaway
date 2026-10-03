---
id: 117
uid: f6d8b603-33ae-4249-afd4-5b5130ed7982
title: Render box-drawing, blocks and cell backgrounds procedurally, at full cell size
type: feature
status: backlog
milestone: primitives
depends_on:
- 116
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: grid
effort: l
---

## Problem

0116: lines meet at one density for one font. Everything framed depends on this,
so it lands before the polish pass touches a component.

## Proposal

Implement the decision in the glyph painter, the CSS package and the testing
helpers. Keep the engine pure: it already knows every cell's edges.

## Acceptance criteria

- [ ] Every painted cell is a full cell box: nothing in a painted screen takes its height from the font
- [ ] Box-drawing cells carry their edge weights, and are stroked by a stylesheet generated at build time from the junction table
- [ ] Light, heavy, double and rounded all render, with stroke widths from tokens
- [ ] Block elements and the eight bars are drawn by the cell, so a scrollbar thumb is one solid run
- [ ] Reverse video and cell backgrounds fill the whole cell: no stripes between rows
- [ ] The character stays in the DOM, transparent: copy yields the box, text snapshots are unchanged
- [ ] Glyph and rule painters share the renderer; the per-stroke rule painter is retired and 0114 dropped
- [ ] Forced colors keeps strokes visible as CanvasText, verified in the forced-colors browser
- [ ] Strokes print
- [ ] checkContinuity in @rockaway/react/testing pixel-checks that every stroke reaches its cell edges, and runs on every story like conformance
- [ ] Continuity passes at all four densities, both painters, every border set, and at 200% zoom
- [ ] The before and after measurements are recorded here
- [ ] docs/concept.md states the principle and the painters section is rewritten
