---
id: 75
title: Recast the tokens for the grid
type: decision
status: done
milestone: retheme
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Context

The token pipeline is good and stays. Its contents were designed for a pixel
system, and half of them have nowhere to live on a character grid.

## Decision

Decided 2026-09-23.

| Group | Fate | Becomes |
| --- | --- | --- |
| `radius.*` | gone | corners are glyphs; `loose` may add radius in the rule painter |
| `shadow.*` | gone | overlays separate by border weight and a `░` backdrop |
| `font.size.*` | gone | one size; a display size exists only on a 2-cell row |
| `space.*` | recast | whole cells: `space.1` is one cell across, one row down |
| `size.control.*` | recast | rows: `sm` 1, `md` 1, `lg` 3 (a bordered box) |
| `text.*` | recast | attributes: bold, dim, reverse, underline, caps |
| `palette.*` | recast | ANSI 16 plus bright, generated in OKLCH, mapped to semantic roles |
| `motion.*` | recast | frames on a tick: spinner 80ms, blink 500ms, collapse on reduced motion |
| `border.*` | new | the five border sets, as character tokens |
| `cell.*` | new | width, height, ratio, and the density rows |
| `glyph.*` | new | marks, blocks, braille frames, cursor |
| `attribute.*` | new | how emphasis is drawn, so a theme can choose |
| `conformance` | new | `strict`, `standard`, `loose` |

**The semantic tier keeps its names.** `bg.surface`, `fg.muted`,
`border.control`, `border.focus` all still mean what they meant: only the
values behind them change. Every component written against the semantic tier
survives the pivot.

## Consequences

- The contrast gate (0022) runs unchanged, and gains a case: reverse video, checked both ways round
- The generator loses three categories and gains four; the resolver and the contexts do not change at all
- A terminal theme export becomes trivial, because the palette is already ANSI 16
