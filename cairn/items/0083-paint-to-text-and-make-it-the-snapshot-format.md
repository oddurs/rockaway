---
id: 83
title: Paint to text, and make it the snapshot format
type: feature
status: backlog
milestone: grid
depends_on:
- 82
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: grid
effort: s
---

## Acceptance criteria

- [ ] `toText(buffer)` returns exactly what the screen shows, one line per row
- [ ] Trailing whitespace is trimmed so diffs stay readable
- [ ] A Vitest serializer prints a buffer as a screen, so a failing assertion looks like the UI
- [ ] Round trip: text in, buffer out, text again, unchanged
