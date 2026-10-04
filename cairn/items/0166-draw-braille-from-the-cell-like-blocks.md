---
id: 166
uid: 1ff784d3-0aac-431a-9af6-7ad739478c35
title: Draw braille from the cell, like blocks
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: grid
effort: m
---

## Problem

The spinner and sparkline-style charts are braille, and many monospace fonts —
JetBrains Mono, the site's font — have none, so they fall back to another face.
Terminals draw braille procedurally for the same reason they draw box drawing.

## Acceptance criteria

- [x] The cell renderer draws the 256 braille patterns as dots in the cell, at every density
- [x] The spinner and any braille glyph render with no font that contains braille
- [x] A text snapshot is unchanged: the character stays in the DOM

## 2026-10-03

Braille is a shape kind in packages/grid/src/shape.ts: 256 patterns, each a set of square dots of side min(cell width/4, cell height/8), centred in the quarters across and eighths down, never touching an edge. The stylesheet does not get 256 rules: one rule for [data-rk-shape^="braille-"] has eight layers, each var(--rk-dot-N, none), and eight [data-rk-dots~="N"] rules raise them (73 lines of CSS). The painter writes data-rk-dots; shapeAttributes(ch) does the same for single-element chrome, which the spinner story now uses. Squares, not circles: crisp at every density, and they read as braille at cell size. Proven by Grid/Continuity › Braille: all 256 patterns at all four densities (and at 2x in the zoom project), each dot place sampled from a screenshot and inked exactly when the pattern raises it, with the character's fill transparent. The generator now throws on a measure term it has no property for: it silently dropped the new dot term at first.

## Result

All 256 braille patterns are drawn by the cell as square dots, from one shared rule; the spinner needs no font with braille.
