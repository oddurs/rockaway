---
id: 296
uid: 70c467d6-ef2f-4a21-a5bc-69e658a75bcc
title: Size type in whole rows, at its natural width
type: decision
status: doing
milestone: grid
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-09
updated: 2026-10-09
priority: p0
layer: grid
effort: m
---

## Purpose

Size N scales the font so its glyphs fill N rows at the current density (from the font's measured content height); glyphs keep their natural advance, and the run's width rounds up to whole cells and pads the end, so the block is an exact N by K rectangle. Owner request.

## The rule

- **Vertically:** size N scales the font so its glyph box (ascent plus descent) fills exactly N rows at the current density. 
- **Horizontally:** letters keep their natural advance and don't snap to columns. An inline run's box rounds up to whole cells and pads at its end.

## Formula

Where `line` is the density's line box over the font size (`--rk-cell-line`: 1, 1.5, 2 or 2.75) and `content` is the face's (ascent + descent) / em (`--rk-font-content`):

```
font-size   = N × line × 1em / content     (1em = the ordinary size)
line-height = content × 1em                (the scaled em) = N rows exactly
inline box  = round(up, chars × cell × N × line / content − cell/256, cell)
```

Width is measured outside the scaled glyphs, in the ordinary font, because `1ch` inside them is the scaled face's, and Chromium rounds it, so a cell computed back from it is 1/32px short and the next box lands off the grid. That is why the markup has two elements: `.rk-text-glyphs` carries the scaled font, while `.rk-text-inline` holds the width in cells.

## Font metrics

Measured from each face with fontTools, hhea = typo, `USE_TYPO_METRICS` on:

- IBM Plex Mono: 1025 + 275 = **1.30**, advance 0.6, cap 0.698
- JetBrains Mono: 1020 + 300 = **1.32**, advance 0.6, cap 0.73
- System (Noto Sans Mono): **1.36** (tallest common system face)
- Berkeley Mono: **1.36** (provisional until font metrics read)

The token `--rk-font-content` takes these values and exports per face.

## Measurements

Taken on macOS at 16px, in Chromium, Firefox, and WebKit at 1×, plus Chromium at 2× zoom; sizes 2, 3, 4 at all four densities, both IBM Plex and JetBrains:

- **Height:** exactly N rows in all three engines, every case.
- **Content area:** fills the box exactly in Chromium and WebKit. Gecko rounds ascent and descent to whole px, overhanging about 0.5px each side.
- **Ink:** stays inside the box everywhere. Smallest margin 0.39px (Chromium, Plex, dense, N=2).
- **Baseline:** Chromium rounds to whole px, Firefox to about half px, WebKit keeps it exact. Spread at most 0.5px.
- **Width:** whole cells in all engines (within 1/64px layout snapping); `cellsIn` = `cellsCovering` = expected K, next box starts on that column.
- **N=2 at dense shrinks the font** (0.77×), because the glyph box is taller than a dense row. So sizes are 2, 3, 4 only at dense; at normal, airy, touch they are 1.54×, 2.31×, 3.08× for size 2, and 2.31×, 3.46×, 4.62×, 6.35× for size 3 respectively.
- **Next to 1× text:** an inline sized box with `vertical-align: bottom` keeps the line exactly N rows in all engines, with the 1× text in the last row, on the grid. `top` also stays on grid with 1× text in the first row. `baseline` shares the baseline but leaves 1× text a few px off the row grid. `text-bottom` makes the line taller than N rows. Chose `bottom`.
- **Linux CI:** font metrics via hinting are not yet re-measured. Tokens accept the value.

## In screenshots and copy

`screenshot()` reads a run set inline as its characters one to a cell from its first cell, padding to K, blank rows under it. No change was needed; the scaled glyphs sit inside their own cell box.

A reader copying a run set in a heading gets the words alone. Base.css uppercases them for h1/h2/h3, and the copy gives capitals, as a terminal's selection would.

## In continuity

Letters above a screen at dense have descenders that reach into the screen's first row; that was the Divider *Between panes* bug fixed in #222. Letters are transparent in `chromeOnly`, so sized glyphs never read as leaks, and ink stays inside the N rows everywhere they are drawn.

## In conformance

At `strict` level, each `.rk-text` is a new `SizedText` violation. `SizedText` is exported from testing and declared in metadata.

## At zoom

Everything scales together. Chromium at 2× measured identical proportions: a size-2 run at 2× is still 2 rows, still the right number of cells wide.

## In forced colours

Text is plain text. `forced-color-adjust` is not set, so Plex or JetBrains may substitute, but the scaling still holds. Emphasis is an attribute (bold, dim, underline) and colors from the palette, as they are in a terminal.

## What this amends

Closes 0075's statement "one size; a display size exists only on a 2-cell row". Multiple sizes exist now, at every density and in every painter. Needs updates to `concept.md`, `base.css` and `prose.css`, all of which say "one size".
