---
id: 230
uid: 972d8327-a2f2-42ee-a81c-ab3090d55ff1
title: Clip checkContinuity to what a scroll region shows
type: feature
status: backlog
milestone: primitives
depends_on:
- 117
- 208
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

`checkContinuity` photographs a painted layer whole, so a table scrolled across
fails on its hidden cells, and the Table story has to turn continuity off.

## Acceptance criteria

- [ ] Continuity checks only the cells a scroll region shows, and Table's scrolling story runs it
