---
id: 298
uid: 33ce982d-95a2-4e58-b67f-0698b5287bd8
title: Draw block-letter display type with the cell renderer
type: feature
status: doing
milestone: later
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: grid
effort: m
---

## Purpose

Big letters built from block shapes for a hero, with the real heading kept for assistive technology. After the row-sized type lands.

## Problem

`Text` (0296, 0297) makes type larger by scaling the font. A terminal has no such thing: its large type is figlet, letters drawn out of cells. That is also the one large type a `strict` screen could allow, because every part of it is a whole cell drawn by the cell renderer.

## Proposal

This is the design. Build it once 0296 and 0297 have landed.

**Letterforms are data in the engine.** `@rockaway/grid` gets a letterform table: for each character, rows of cells, each cell one of a small set of block shapes. There are two faces, both drawn here rather than taken from figlet fonts, whose licences vary:

- `block5`: five rows tall, full blocks only (`█` and blank). Each letter is three to five cells wide, with one blank cell between letters. It needs only `full`, so it works in every repertoire: under the ASCII theme the cells are `#`, the theme's `block.full`.
- `half3`: three rows tall, built from `▀`, `▄`, `█` and blank, so six pixels tall. It is finer and needs the Unicode repertoire. Under ASCII it falls back to `block5`, because half blocks have no ASCII form.

The character set is A–Z, 0–9 and `. , : ! ? - ' / & @`. Lower case is set as capitals, as figlet does.

**A pure buffer function.** `blockLettersBuffer(text, { face }, glyphs): Buffer`, in a `.pure.ts`, takes `Glyphs` last like every buffer function. Its text snapshot is the documentation: the alphabet in each face. Width is the sum of the letter widths, so it is whole cells by construction and needs no measuring. It never wraps.

**The component.** `<BlockLetters text="Rockaway" as="h1" face="block5" />` renders:
- the element `as`, holding the real words in a visually hidden span, so a reader hears a heading;
- the buffer as an `aria-hidden` layer of runs through `<Cells>` (#170), so the blocks are `[data-rk-shape]` cells drawn by `shapes.css`, and adjacent blocks join with no seams, as a scrollbar thumb does. The layer is `user-select: none`.

**Too narrow.** A run of block letters cannot wrap. Each instance renders a `Text` fallback (size 2 for `half3`, 3 for `block5`) beside the letters, and a container query on the element shows the letters only when the container is at least their width in cells (`cqi` against `cols × --rk-cell-width`). It needs no script and is right on the first paint.

**How each check reads it:**
- `screenshot()` sees the blocks; the visually hidden words are left out (#177).
- Copy gives the words. The hidden span is selectable and the blocks are not.
- Continuity checks the blocks like any shaped cells.
- Conformance passes at every level, including `strict`.
- In forced colours, shapes stroke in `CanvasText`.
- In print, runs keep their backgrounds.

## Open questions for the owner

- **Aspect.** A cell is about 0.6 wide by 1 tall at dense and 0.6 by 2.75 at touch, so the same letterform is squat at dense and very tall at touch. Options: accept it, as a terminal would; pick the face by density (`half3` at airy and touch, where rows are tall); or draw a second width for tall cells. Recommendation: pick by density, which costs one table lookup.
- **Rows at touch.** `block5` at touch is five rows of 44px at 16px, 220px tall, which may be too much for a hero on a phone. The container query could also cap it by rows.

## Acceptance criteria

- [ ] `block5` and `half3` letterform tables in `@rockaway/grid`, with an alphabet snapshot for each
- [ ] `blockLettersBuffer` is pure, takes `Glyphs` last, and is ASCII under the ASCII theme
- [ ] `BlockLetters` reads its words to assistive technology as the heading it is, and the blocks are `aria-hidden`
- [ ] The blocks join with no gap in continuity, in both painters and at every density, at 100% and 200% zoom, and in forced colours
- [ ] It conforms at `strict`
- [ ] Too narrow, it shows its `Text` fallback with no script, and the site test sees no difference with JavaScript off
- [ ] Copy gives the words and `screenshot()` gives the blocks
- [ ] A site page with an example, and metadata
