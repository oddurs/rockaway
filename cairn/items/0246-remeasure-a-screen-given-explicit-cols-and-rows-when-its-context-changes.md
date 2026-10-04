---
id: 246
uid: f2db7e88-f354-40f8-a588-281ced175f03
title: Remeasure a screen given explicit cols and rows when its context changes
type: bug
status: ready
milestone: grid
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: grid
effort: m
---

## Purpose

0199 remeasures measured screens when density, mode or font size change; a screen given cols and rows keeps its first cell size. Until then an open popover is placed exactly only at the density its trigger's screen first measured in. Found by the fields engineer in 0128.
