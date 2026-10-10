---
id: 283
uid: 2248f378-c657-4274-9d31-a43701fe78db
title: Keep data refreshing under reduced motion
type: feature
status: done
milestone: tokens
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p2
layer: tokens
effort: s
---

## Purpose

Reduced motion stops animation, not information. A ticks.refresh that keeps counting slowly under reduced motion, and a useReducedMotion export. On #188.

## 2026-10-10

Landed in #188: data keeps refreshing under reduced motion; only the animation stops.
