---
id: 264
uid: d0cd7fd5-d512-4459-bcba-84082591323c
title: Judge an inset mark against its own geometry in the leak rule
type: bug
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

Braille dots and the 7/8 leading block sit an eighth of a cell inside an edge; at a fractional cell start they antialias into the first whole pixel and the leak rule flags them (known eighth-inset-spill). Read each shape's geometry from shape.ts instead of a fixed edge band, then drop Progress's set-aside leaks.

## 2026-10-04

The leak rule now judges a shape's own inset marks by its geometry: for a side the shape does not reach, insetOf resolves its marks (shape.ts, resolve, the layer's stroke widths read through a probe) to the nearest mark's distance from that edge, and only lines a whole pixel of antialiasing clear of it are read (clear = floor(inset - 2 - edge offset)); with none clear, the side is not read. Braille dots (w/8 in) and the bare eighth of the blocks are never read as lines; box-drawing marks, about half a cell in, are read as before, and the leaky ▄ in Edge ink beside an edge with none is still caught. New story Marks set in from an edge (braille at every edge, ▉▊▋▌▍▎▏▕, nine sizes and offsets) passes, and fails without the rule change (leaks at ⣿ ⡇ ⠿ ⡏ ⠛ west edges). With #188 merged locally and both set-asides dropped (the eighth-inset-spill entry and the filter in the eight Progress continuity stories, now expectContinuity), all 42 Progress stories pass. Stacked on #151; #188 drops its set-asides when this lands, as tokens listed.
