---
id: 80
title: 'Measure text in cells: wcwidth, truncation, wrapping'
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
effort: m
---

## Acceptance criteria

- [x] `wcwidth` over Unicode 15: 2 for wide and fullwidth, 0 for combining and zero-width, 1 otherwise
- [x] Grapheme clusters are never split, including flags and skin-tone sequences
- [x] Truncation lands on a cell boundary and appends the ellipsis glyph within the budget
- [x] Wrapping breaks on spaces where it can and mid-word where it must, and never exceeds the width
- [x] Tested against a CJK, Arabic, combining-mark and tab-containing corpus

## 2026-09-22

Wrapping has one documented exception: a single grapheme wider than the whole line — a Han character in a one-cell column — goes on a line of its own, because there is nowhere else for it to go. The test asserts that case rather than pretending it cannot happen. `fit` was renamed `pad`: Biome reads `fit(` as Jasmine's focused-test function, and a lint rule that fires on a public API name is a bad name.
