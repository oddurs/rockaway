---
id: 315
uid: dbfbe7bd-2364-42e7-9cff-32cc50434dc7
title: Hold each tier to its own rule in conformance
type: feature
status: done
milestone: primitives
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: tooling
effort: m
part_of:
- 311
---

## Purpose

Structure on whole cells, rhythm on half-steps, free zones exempt but their block's seams whole; a leak past a seam fails by name. A rhythm audit reports every non-whole spacing. Continuity unchanged. Part of decision 0311.

## Result

checkConformance reads the tiers: half-steps inside a rhythm block or a control at standard, a seam whole cells at every level, and a rhythm audit of every box that bends (#244).
