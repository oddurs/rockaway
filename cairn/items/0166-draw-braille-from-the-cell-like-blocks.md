---
id: 166
uid: 1ff784d3-0aac-431a-9af6-7ad739478c35
title: Draw braille from the cell, like blocks
type: feature
status: backlog
milestone: primitives
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: grid
effort: m
---

## Problem

The spinner and sparkline-style charts are braille, and many monospace fonts —
JetBrains Mono, the site's font — have none, so they fall back to another face.
Terminals draw braille procedurally for the same reason they draw box drawing.

## Acceptance criteria

- [ ] The cell renderer draws the 256 braille patterns as dots in the cell, at every density
- [ ] The spinner and any braille glyph render with no font that contains braille
- [ ] A text snapshot is unchanged: the character stays in the DOM
