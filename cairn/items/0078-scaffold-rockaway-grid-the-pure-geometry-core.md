---
id: 78
title: 'Scaffold @rockaway/grid: the pure geometry core'
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 71
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Proposal

A package with no DOM, no React and no CSS: cells, rectangles, buffers and the
types every painter shares.

## Acceptance criteria

- [x] `Buffer`: a W×H matrix of cells, each a character plus attributes and colour roles
- [x] `Rect` and `Point` in cells, with the usual set operations, all integer
- [x] Immutable operations return a new buffer; nothing mutates in place across a boundary
- [x] Zero dependencies, ESM only, and it runs in Node, a browser and a worker
- [x] 100% of the public surface is covered by tests, because everything above depends on it
