---
id: 230
uid: 972d8327-a2f2-42ee-a81c-ab3090d55ff1
title: Clip checkContinuity to what a scroll region shows
type: feature
status: done
milestone: primitives
depends_on:
- 117
- 208
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

`checkContinuity` photographs a painted layer whole, so a table scrolled across
fails on its hidden cells, and the Table story has to turn continuity off.

## Acceptance criteria

- [x] Continuity checks only the cells a scroll region shows, and Table's scrolling story runs it

## 2026-10-03

checkContinuity photographs the part of a layer its clipping ancestors show, through a transparent window over that part, and reads only the cells wholly inside it; the rest are counted in the report's unseen. A region's overflow marks lie over the chrome on purpose and are hidden for the screenshot, as content is. Grid/Continuity 'In a scrolled region' (583 breaks with the clipping stubbed out) and Table's Scrolls story, which no longer opts out and checks itself half way into a cell with snapping off. #151.
