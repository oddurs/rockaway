---
id: 176
uid: d304e3f9-8918-406a-8d45-3f3648b8ae28
title: Stroke the junctions Unicode lacks from the raw edges
type: bug
status: backlog
milestone: later
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: grid
effort: m
---

## Problem

Where Unicode has no glyph for a mix of weights (double meeting heavy), the
engine draws one weight lower, and the cell renderer strokes the glyph in the
cell, so the line steps against an undemoted neighbour, as it does in a font.

## Acceptance criteria

- [ ] For the keys Unicode lacks, strokes come from the buffer's edges and the line does not step
- [ ] The copied character for those cells is documented as the demoted glyph
