---
id: 116
uid: 17f6f198-0ce9-4b31-bc57-94ed39a0dc29
title: Draw lines, blocks and cell backgrounds from the cell, never from the font
type: decision
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: grid
effort: m
---

## Context

A box only reads as a box if its lines meet. Today the glyph painter draws `│`
with the font, and the font decides how tall that stroke is — not the cell.
Measured in the workbench (system mono, 16px):

| density | cell | font `│` ink | result |
| --- | --- | --- | --- |
| dense | 16px | 20.4px | bleeds 4.4px into the rows above and below |
| normal | 20px | 20.4px | meets, by coincidence of this font |
| airy | 24px | 20.4px | 3.6px gap between every row |
| touch | 32px | 20.4px | 11.6px gap |

So a line connects at one density, for one set of font metrics. Whether a box
closes currently depends on which font the reader has installed. The same is
true of block elements (the scrollbar thumb `█` is a stack of separate blocks
at touch density) and of any cell background: an inline span paints only its
content area, so reverse video stripes at every line height but one.

Density is the line box (0074), and it is not negotiable, so the line box will
never match the font. Something else has to give.

## Options

- **Choose a line height where the font meets.** Per font, per platform, and it
  deletes density. No.
- **Scale the glyphs** (`transform: scaleY(...)`). Stretches the stroke weight
  with the cell and is still at the mercy of each font`s glyph design.
- **The rule painter everywhere.** Connects, but loses the terminal look, and
  costs a positioned element per stroke (0113, 0114).
- **Draw box-drawing and block cells procedurally, from the cell.** What modern
  terminals do for exactly this reason — kitty, WezTerm, Alacritty and Ghostty
  all draw box-drawing and block elements themselves instead of using the font,
  so lines meet at any cell size.

## Decision

The last one. **The font supplies letters. The cell supplies geometry.**

- Every painted cell is a full cell box. Nothing in a painted screen takes its
  height from the font.
- A box-drawing cell carries its edge weights — which the engine already has;
  that is what the junction model is — and a stylesheet draws a half-stroke from
  the cell centre to each weighted side. The neighbouring cell draws the other
  half. Lines meet by construction, at every density, font and zoom.
- That stylesheet is generated at build time from the junction table, the same
  table that picks the glyph. No runtime style injection; it works server-side.
- The character stays in the DOM, transparent, so copy and paste still yields
  `┌──┐`, find-in-page works, and every text snapshot is unchanged.
- Block elements and cell backgrounds follow the same rule.
- Glyph and rule painters become one renderer with two stroke styles: glyph
  strokes are weighted like type, rule strokes are hairlines.

## Consequences

Easy: lines connect everywhere; a theme can change stroke weight as a token;
the rule painter stops costing a node per stroke, which retires 0114.

Hard: forced colors drops `background-image`, so stroked cells need
`forced-color-adjust: none` with the stroke in `CanvasText`; printing drops
backgrounds unless told not to; rounded corners need arcs, not straight
half-strokes; and the connection has to be *tested* — a pixel check that every
stroke reaches its cell edges, run on every story, the way grid conformance is.

Revisit if: a browser ships a way to make a font`s box-drawing glyphs fill the
line box (nothing on the horizon does).
