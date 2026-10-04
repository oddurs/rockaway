---
id: 247
uid: b911c7c6-abc5-4b75-b7cc-db381b9a3775
title: Make the popover and modal border weights theme glyph tokens
type: feature
status: ready
milestone: tokens
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tokens
effort: s
---

## Purpose

Popover and Dialog hard-code their frame weights (heavy, double). Add Glyphs.weight.{emphasis, raised, modal}, defaulting to heavy, heavy and double, ASCII under an ASCII theme, so a theme can change them. Proposed by the fields engineer in 0128; the tokens engineer is building it.
