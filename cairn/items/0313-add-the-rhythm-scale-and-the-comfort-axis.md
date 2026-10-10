---
id: 313
uid: 7ba2ee20-e673-4aac-87db-a35d2e6a5d81
title: Add the rhythm scale and the comfort axis
type: feature
status: done
milestone: tokens
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: tokens
effort: m
part_of:
- 311
---

## Purpose

Tokens for half-steps (--rk-step-x, --rk-step-y) and a spacing scale in rows and columns (0.5, 1, 1.5, 2, 3, 4, 6); a comfort axis (compact, comfortable, spacious) settable per region, separate from density. Part of decision 0311.

## Result

Comfort, a region's rhythm: compact, comfortable (the default) and spacious, as --rk-rhythm-* under data-rk-comfort, held to the grid's table by a test (#244).
