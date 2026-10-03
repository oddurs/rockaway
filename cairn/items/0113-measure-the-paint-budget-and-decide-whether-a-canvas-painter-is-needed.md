---
id: 113
uid: b3d91ec7-4af8-4303-87a9-219129522ee2
title: Measure the paint budget, and decide whether a canvas painter is needed
type: spike
status: backlog
milestone: site
depends_on:
- 104
- 111
- 117
created: 2026-09-23
updated: 2026-10-03
priority: p1
layer: grid
effort: m
---

## Question

At what screen size do the DOM painters stop holding a frame budget, and is a
canvas painter the answer or is coalescing enough?

## Time box

One day, once a real page exists to measure — the dog-food site, not a story.

## Why it matters

The glyph painter coalesces same-style runs into spans. The rule painter does
not: it emits one positioned `div` per cell with edges, plus one per stroke, so
a full-page frame at 120x40 is thousands of nodes. Nobody has measured it.

## Findings

## Recommendation

## 2026-10-03

Moved to the site milestone by the program plan: the time box says it waits for a real page, and the dog-food site is that page. Depends on 0117, which changes what the rule painter costs.

## 2026-10-03

From 0117: vertical lines and junctions are one element each with up to eight background layers, and nobody has measured that on a full-page frame. Measure the shaped cells here, not only the node count.
