---
id: 296
uid: 70c467d6-ef2f-4a21-a5bc-69e658a75bcc
title: Size type in whole rows, at its natural width
type: decision
status: done
milestone: grid
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p0
layer: grid
effort: m
---

## Purpose

Size N scales the font so its glyphs fill N rows at the current density (from the font's measured content height); glyphs keep their natural advance, and the run's width rounds up to whole cells and pads the end, so the block is an exact N by K rectangle. Owner request.

## Context

0075 recast the tokens for the grid with one size: every element is the ordinary size, and a heading is weight, case or reverse. The owner wants larger type for page titles and a landing line, without leaving the grid. The grid's two axes have different owners. Rows are the line box, which the density sets (`--rk-cell-line`, 0074). Columns are the face's advance (`1ch`). Larger type can fit one of those exactly, not both, because a face's height and its advance do not scale to whole rows and whole columns at once.

## Options

1. **An integer scale** (2×, 3× the font). Neither rows nor columns come out whole: a 2× glyph box is 2 × 1.3em tall, which is no number of rows at any density. Dropped.
2. **Snap each letter to whole columns** (letter-spacing up to the next cell). The letters spread apart and stop looking like type. Dropped.
3. **Fill whole rows, keep the natural advance, pad the run to whole cells.** The owner's rule. Chosen.

## Decision

- **Vertically:** size N scales the font so its glyph box, ascent plus descent, is exactly N rows at the density in force.
- **Horizontally:** the letters keep the scaled face's natural advance and do not snap to columns. A run's box is rounded up to whole cells, and the rest of its last cell is padding.
- **Sizes are 2, 3 and 4.** Size 1 is ordinary text and needs no component. Worked through the formula it would not even be the ordinary font: at dense it is 0.77×, because the glyph box is taller than a dense row.
- **No JavaScript.** The stylesheet does all of it, so a server-rendered page is right before hydration and with scripts off.

### Formula

- `line` is the density's line box over the font size (`--rk-cell-line`: 1, 1.5, 2 or 2.75).
- `content` is the face's (ascent + descent) / em (`--rk-font-content`).
- `cell` is the ordinary cell (`--rk-cell-width`).
- `chars` is the run's width in cells at the ordinary size (`--rk-chars`, which `Text` writes at render from its words).

```
font-size    = N × line × 1em / content        1em: the ordinary size
line-height  = content × 1em                   1em: the scaled size, so N × line × the ordinary em: N rows
inline box   = round(up, max(chars × 1ch, chars × cell × N × line / content) − cell / 256, cell)
                                               1ch: the scaled face's advance
```

- The line box is the glyph box, so there is no leading to share. The glyphs start on the first row and end on the last, and the baseline is the ascent down from the top.
- `1ch` inside the glyphs is the advance the words are laid out at. The second term is the ordinary cell scaled, which is what `textCols` counts on a server. Taking the wider means the box always covers the words and is never narrower than the cells `textCols` and `textBuffer` give. On a face that is not hinted the two terms agree.
- A 256th of a cell comes off before rounding, so a run that is whole cells by arithmetic does not gain a cell from floating-point error.
- The box rounds to the **ordinary** cell. It is carried into the glyphs as a registered `<length>` (`--rk-text-cell`), which computes to pixels on the outer element, in the ordinary font. Worked back from the scaled `1ch` it would be off by the engine's rounding of that `1ch`, 1/32px in Chromium, and the next box would land off the grid. That is why the markup has two elements.

### Markup

```html
<h1 class="rk-text" style="--rk-size:2"><span class="rk-text-glyphs">Start</span></h1>
<span class="rk-text rk-text-inline" style="--rk-size:3;--rk-chars:8"><span class="rk-text-glyphs">Rockaway</span></span>
```

In React these are `<Text size={2} as="h1">` and `<Text size={3} inline>`. The size is a custom property, not a `data-*` variant, because a variant may not set a size (0118, `variant-geometry.test.ts`).

- **A block** (`.rk-text`) takes its container's width, which is whole cells, and wraps inside it, each line N rows. It takes that width in prose too. Prose's h1 and h2 otherwise shrink to their words (`inline-size: fit-content`), and a heading shrunk to scaled words is a fraction of a cell wide. Its prose rule then runs the measure's length. In any other box that shrinks to what it holds, such as a flex item or a float, a block is as wide as its scaled words, so set it inline there.
- **Inline** (`.rk-text-inline`) is an `inline-block` with `vertical-align: bottom`. It never wraps, because a run that broke would be 2N rows in a box measured for N. It needs `--rk-chars`.

### Metrics

Read with fontTools from the faces themselves. hhea and OS/2 typo agree, and `USE_TYPO_METRICS` is set, so every engine uses the same ascent and descent.

| face | ascent + descent, per 1000 | `content` | advance | cap height |
| --- | --- | --- | --- | --- |
| IBM Plex Mono | 1025 + 275 | 1.30 | 0.600 | 0.698 |
| JetBrains Mono | 1020 + 300 | 1.32 | 0.600 | 0.730 |
| system (unknown face) | Noto Sans Mono's, the tallest common one | 1.36 | | |
| Berkeley Mono | not read yet | 1.36 | | |

`font.content` is a token per type pairing: `--rk-font-content`, a registered `<number>` with initial value 1.36. A face whose real glyph box is shorter than its token is set a little small and centred in its rows by the half-leading, and never overflows; Menlo, DejaVu Sans Mono and Cascadia are about 1.16. A theme or a page that sets its own face sets `--rk-font-content` beside `--rk-font-family-mono`.

The scale with Plex (`textScale`):

| size | dense | normal | airy | touch |
| --- | --- | --- | --- | --- |
| 2 | 1.538× | 2.308× | 3.077× | 4.231× |
| 3 | 2.308× | 3.462× | 4.615× | 6.346× |
| 4 | 3.077× | 4.615× | 6.154× | 8.462× |

The owner's "two rows is three times" is the box: 48px is 3 × 16px at normal. The font itself is 2.31×.

### Measured

On macOS at 16px, in Chromium, Firefox and WebKit at 1× and in Chromium at 2×. N was 1 to 4 at all four densities, in Plex and in JetBrains Mono.

- **Height:** exactly N rows in all three engines, in every case.
- **Glyph box:** fills the rows exactly in Chromium and WebKit. Gecko rounds the ascent and the descent each to a whole pixel, so it overhangs by up to half a pixel at either edge.
- **Ink:** inside the rows everywhere. The least margin is 0.39px, at N = 1, dense, Plex, Chromium. Sizes 2 to 4 have more.
- **Baseline:** Chromium rounds it to a whole pixel, Gecko to about half a pixel, and WebKit keeps it exact. They are at most half a pixel apart.
- **Width:** whole cells in every engine, within the 1/64px layout unit. The box is `textCols` cells and the next box starts on that column.

On Linux, Chromium hints faces: IBM Plex Mono at 16px lays out at a 10px advance, not 9.6px. Each scaled size is laid out at its own rounded advance, which is not the ordinary advance scaled.

- At 16px every scaled advance comes out under the scaled cell, so the box is `textCols` cells.
- At a base size whose advance rounds down, such as 14px in Plex (8.4px laid out at 8px), the scaled run is wider than its ordinary width scaled by about the scale times what the ordinary advance lost: about a pixel a letter at size 2. A box worked from the ordinary cell alone would be narrower than its words. The `1ch` term is what covers it.
- CI checks height, whole cells, that the box covers the laid-out words, and that it pads less than a cell, on every run (*Every size*, *Densities*). *Glyphs fill their rows* sets whichever of IBM Plex Mono and JetBrains Mono the workbench loads, with its token, and checks the engine's glyph box is N rows, from the first row, within a pixel, at all four densities.

### Beside ordinary text

An inline sized run with `vertical-align: bottom` keeps the line exactly N rows in every engine, with the ordinary text on the last row, on the grid. The alternatives were measured too:

- `top` also stays on the grid, with the ordinary text on the first row.
- `baseline` shares the large word's baseline but leaves the ordinary text a few pixels off the row grid.
- `text-bottom` makes the line taller than N rows.

So the two baselines do not coincide. The ordinary text's baseline is its own row's, a few pixels above the large word's. The grid wins over a shared baseline, as it does everywhere else in the system.

## Consequences

- **`screenshot()`** reads a sized run as its characters one to a cell from its first cell, then padding to K, and blank rows under it. That is `textBuffer`. It needed no change.
- **Copy** gives the words alone, because the padding is a box, not characters. Chromium and WebKit copy what is shown, so an h1 copies in capitals (base.css uppercases h1). Gecko copies the letters as written.
- **Continuity:** sized letters are text, never `[data-rk-shape]` cells. `chromeOnly` makes every letter transparent (#222), so they cannot read as a leak, and their ink stays inside their rows anyway.
- **Conformance:** a sized block is measured like any box, N rows by whole cells. Boxes inside `.rk-text-glyphs`, such as an emphasis or a link, are in the scaled face and are not measured. At `strict` every `.rk-text` is a `SizedText` violation (`what: 'size'`), because a terminal has one size.
- **Zoom:** everything is relative, so rows, cells and glyphs scale together. Chromium at 2× measured the same, and *Every size* runs in the zoom project.
- **Forced colours:** it is plain text, drawn in `CanvasText` like any other, with nothing opted out.
- **A face that fails to load:** the rows and the cells hold, because they come from the token and `1ch`, not from the glyphs. Only where the letters sit in their rows changes.
- **0075 is amended.** One size is still the default for every element. Type larger than a cell is asked for with `Text` and measured in rows. `concept.md`, `base.css` and `prose.css` say so.
- **We would revisit it** for a face whose hhea and typo metrics differ without `USE_TYPO_METRICS`, because engines would then disagree on the glyph box, or for a size between rows.

## 2026-10-09

Decided as written. CI on Linux (ad70ca96) confirms it: N rows, whole cells, the box covers the laid-out words, and the glyph box fills the rows within a pixel.
