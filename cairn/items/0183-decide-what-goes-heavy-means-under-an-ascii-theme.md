---
id: 183
uid: 7cbf09b7-ae58-4b2e-a5f4-43102e3847f9
title: Decide what goes heavy means under an ASCII theme
type: decision
status: backlog
milestone: primitives
depends_on:
- 118
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: grid
effort: s
---

## Context

0118 draws a focused framed control and an invalid one by turning its frame
heavy. An ASCII theme has no heavy line. Text field `lg` (0035) and Fieldset
(0127) need an answer before they are built. Raised by the Frame polish (0129).

## Options

- `#` and `=` for a heavy ASCII frame
- Keep `-|+` and signal with an attribute (bold, reverse on the title)

## Decision

To be made by whoever builds the first framed control; record it here and in
0118's table.
