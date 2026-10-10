---
id: 232
uid: ed186bbf-42df-41af-b104-d686540074ee
title: Render a table header in one pass
type: chore
status: backlog
milestone: primitives
depends_on:
- 57
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## Problem

Table's Column learns its index from `th.cellIndex` after mount, so a header
narrower than its words is cut one render late.

## Acceptance criteria

- [ ] Headers know their column during render, and no story sees a late cut
