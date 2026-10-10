---
id: 312
uid: d8090666-e4a9-4e6e-aa64-1d5a321d1d76
title: Lay out in half-units, and add Flow
type: feature
status: ready
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p0
layer: grid
effort: l
part_of:
- 311
---

## Purpose

The grid engine works internally in half-cells and checks that seams land on whole cells. Flow is a vertical run of blocks with rhythm gaps whose total snaps to whole rows; layoutPanes, fitStatus and stacking take half-step gaps. Part of decision 0311.
