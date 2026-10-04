---
id: 264
uid: d0cd7fd5-d512-4459-bcba-84082591323c
title: Judge an inset mark against its own geometry in the leak rule
type: bug
status: ready
milestone: primitives
created: 2026-10-04
updated: 2026-10-04
priority: p2
layer: grid
effort: m
---

## Purpose

Braille dots and the 7/8 leading block sit an eighth of a cell inside an edge; at a fractional cell start they antialias into the first whole pixel and the leak rule flags them (known eighth-inset-spill). Read each shape's geometry from shape.ts instead of a fixed edge band, then drop Progress's set-aside leaks.
