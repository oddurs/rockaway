---
id: cdc15a8d-8702-48a7-9e92-8d5cb93affaa
title: Coalesce rule-painter strokes into runs
type: chore
status: backlog
milestone: later
depends_on:
- b3d91ec7-4af8-4303-87a9-219129522ee2
created: 2026-09-23
updated: 2026-09-23
priority: p3
layer: grid
effort: m
---

## Problem

One `div` per ruled cell and one per stroke. A horizontal run of forty light
edges is forty-one nodes where it could be one.

## Proposal

Walk each row and column for runs of equal weight and emit one stroke per run,
the way the glyph painter already coalesces spans. Junctions stay per-cell.

## Acceptance criteria

- [ ] A run of equal-weight edges paints as one element
- [ ] A text snapshot of the same buffer is unchanged: coalescing is invisible
- [ ] Node count asserted for a 80x24 full frame
