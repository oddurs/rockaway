---
id: 91
title: Emit glyph and attribute tokens
type: feature
status: done
milestone: retheme
assignee: Oddur Sigurdsson
depends_on:
- 73
- 75
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [x] The five border sets as character tokens, keyed to the junction table
- [x] Marks, blocks, braille frames and the cursor as tokens a theme can swap
- [x] Attribute tokens: what bold, dim, reverse and underline mean in this theme
- [x] Every glyph in every set measures one cell, asserted by the measurement code

## 2026-09-23

Caught here: the type pairings still named Inter, Newsreader and Figtree, which cannot hold a grid — `ch` in a proportional face means nothing. They are monospace families now (system, jetbrains, ibm-plex, berkeley), the workbench renders in JetBrains Mono, and the metric-matched Inter fallback went with them: the system mono stack is already there, so text has a cell from the first paint.
