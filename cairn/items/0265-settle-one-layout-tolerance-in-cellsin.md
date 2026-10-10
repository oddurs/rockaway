---
id: 265
uid: c7acf721-9e9e-4173-8020-217d377acddb
title: Settle one layout tolerance in cellsIn
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-04
updated: 2026-10-04
closed_at: 2026-10-04
priority: p2
layer: grid
effort: m
---

## Purpose

Select's trigger, Popover, Button and the overlay sheet each came out a hair over N cells, and each patched it locally (1/32px here, an explicit width there). Error grows with runs laid out in a row; set one principled tolerance in cellsIn and route the overlay's rounding through it.

## 2026-10-04

Done on #194 with 0228. One function per question rather than one number, because fitting and covering fail differently: cellsIn (fit in a box the page gives) keeps CELL_SNAP, 1/32px, since a box's edge is hard and a sixteenth let the touch sheet run 0.6px past a 1200px viewport; cellsCovering (cover a length laid out in cells, many boxes) takes CELL_COVER_GRACE, a sixteenth of a cell. The overlay's trigger rounding now goes through cellsCovering in a layout effect, replacing its CSS 1px/32 round-up. Grid/Cell grace measures both in three engines; the concept doc's grid section says why long rows telescope (200 boxes sized one by one drift a fifth of a cell). #195's sheet 1px/32 is CELL_SNAP's rule; its 0.01-cell centring tie is to be exported beside CELL_SNAP once #195 lands.
