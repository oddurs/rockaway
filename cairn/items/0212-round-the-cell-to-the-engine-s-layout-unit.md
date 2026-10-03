---
id: 212
uid: e11fa868-123f-4253-821f-6a421dd480c3
title: Round the cell to the engine's layout unit
type: bug
status: backlog
milestone: primitives
depends_on:
- 83
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: grid
effort: s
---

## What happens

Firefox lays text out in 1/60px and the cell is rounded to 1/64px (Chromium's
unit), so forty one-cell runs and one forty-cell run end up to 0.317px apart at
16.4px. Chromium and WebKit are exact. Known entry `firefox-columns` (0124).

## Acceptance criteria

- [ ] The cell is rounded to the layout unit of the engine drawing it, and "A column is a column" passes in Firefox
- [ ] The `firefox-columns` entry is removed
