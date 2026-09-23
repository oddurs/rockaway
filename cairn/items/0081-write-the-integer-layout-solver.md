---
id: 81
title: Write the integer layout solver
type: feature
status: backlog
milestone: grid
depends_on:
- 78
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: grid
effort: l
---

## Problem

Cells cannot be divided. Three panes in eighty columns is 26.67 each, and
somebody has to decide who gets the extra cell — deterministically, or the
layout jitters as it resizes.

## Proposal

A small solver over rows and columns: each child is `fixed(n)`, `grow(weight)`
or `min/max`, and leftover cells are distributed by largest remainder, ties
broken left to right.

## Acceptance criteria

- [ ] Output is always whole cells, and always sums to exactly the space given
- [ ] The same inputs always give the same output, and one cell more never moves more than one boundary
- [ ] Overflow is reported, not hidden: a solver that cannot fit says so, and the caller decides
- [ ] Nesting works: a solved box is a container for another solve
- [ ] Property tests over random trees and widths
