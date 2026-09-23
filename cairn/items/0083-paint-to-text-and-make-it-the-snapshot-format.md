---
id: 83
title: Paint to text, and make it the snapshot format
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 82
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: s
---

## Acceptance criteria

- [x] `toText(buffer)` returns exactly what the screen shows, one line per row
- [x] Trailing whitespace is trimmed so diffs stay readable
- [x] A Vitest serializer prints a buffer as a screen, so a failing assertion looks like the UI
- [x] Round trip: text in, buffer out, text again, unchanged
