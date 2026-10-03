---
id: 214
uid: 918c5102-d567-4371-a71f-cba4bb847f3c
title: Corners meet under forced colours in Firefox
type: bug
status: backlog
milestone: primitives
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: css
effort: s
---

## What happens

Under forced colours in Firefox the east stroke of `┌` and `╔` at 0,0 stops short
of the cell edge. Known entry `firefox-forced-corners` (0124).

## Acceptance criteria

- [ ] Corners meet their neighbours under forced colours in Firefox, and the entry is removed
