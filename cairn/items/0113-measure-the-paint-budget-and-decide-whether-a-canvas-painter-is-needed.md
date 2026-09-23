---
id: 113
title: Measure the paint budget, and decide whether a canvas painter is needed
type: spike
status: backlog
milestone: later
depends_on:
- 111
created: 2026-09-23
updated: 2026-09-23
priority: p2
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
