---
id: 296
uid: 70c467d6-ef2f-4a21-a5bc-69e658a75bcc
title: Size type in whole rows, at its natural width
type: decision
status: ready
milestone: grid
created: 2026-10-09
updated: 2026-10-09
priority: p0
layer: grid
effort: m
---

## Purpose

Size N scales the font so its glyphs fill N rows at the current density (from the font's measured content height); glyphs keep their natural advance, and the run's width rounds up to whole cells and pads the end, so the block is an exact N by K rectangle. Owner request.
