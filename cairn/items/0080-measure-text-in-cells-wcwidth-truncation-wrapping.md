---
id: 80
title: 'Measure text in cells: wcwidth, truncation, wrapping'
type: feature
status: backlog
milestone: grid
depends_on:
- 73
- 78
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Acceptance criteria

- [ ] `wcwidth` over Unicode 15: 2 for wide and fullwidth, 0 for combining and zero-width, 1 otherwise
- [ ] Grapheme clusters are never split, including flags and skin-tone sequences
- [ ] Truncation lands on a cell boundary and appends the ellipsis glyph within the budget
- [ ] Wrapping breaks on spaces where it can and mid-word where it must, and never exceeds the width
- [ ] Tested against a CJK, Arabic, combining-mark and tab-containing corpus
