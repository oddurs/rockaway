---
id: 314
uid: 2a4ff464-0275-40fa-ab89-8eadd2eab1bc
title: Snap a block's seams to whole cells
type: feature
status: done
milestone: primitives
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: css
effort: m
part_of:
- 311
---

## Purpose

Three ways, by what is known: sums at render for components, calc-size round-up where supported with a ResizeObserver fallback for content-sized blocks, and cols×rows boxes for media. Part of decision 0311.

## Result

Seams: .rk-seam rounds an auto height up to whole rows in CSS where calc-size can, and useSeam does it elsewhere (#244).
