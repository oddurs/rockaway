---
id: 79
title: Model borders as weighted edges, and resolve junctions from a table
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 73
- 78
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: l
---

## Problem

Where two boxes touch, the seam has to become `┬`, `├` or `┼`, and get it
wrong and the whole illusion collapses. Doing it by hand per component is how
every ASCII UI ends up with broken corners.

## Proposal

Each cell edge carries a weight: `none`, `light`, `heavy`, `double`. A cell's
four edges are a key; a table maps the key to a glyph. Drawing is therefore
commutative: draw a box over a line, or a line over a box, and the seam is the
same.

## Acceptance criteria

- [x] Every combination the Unicode box-drawing block can express maps to a glyph, and the ones it cannot are documented with the chosen approximation
- [x] Merging is commutative and associative, proven over generated input
- [x] Mixed weights resolve to the heavier glyph where Unicode has one (`┝`, `╪`), and to a documented substitute where it does not
- [x] The `ascii` set resolves the same keys to `+ - |`, so geometry is identical across sets
- [x] A grid of two panes sharing an edge renders one line, not two

## 2026-09-22

The fifth criterion — two panes sharing an edge rendering one line — is the same property as the merge test here, but it is only visible once boxes exist, so it is asserted in 0082 with the pane fixture.
