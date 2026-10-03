---
id: 140
uid: 8f661d1f-0f14-44af-be7f-95d695e66f56
title: Callout
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 118
- 129
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## Purpose

A framed note, tip or warning inside prose: what GitHub renders for
`> [!NOTE]`. The site's Markdown turns those blocks into this. Not a toast and
not a dialog.

## Anatomy

`<Callout tone title>`: a Frame with the tone's mark and title in the top edge, and prose inside.

## States

`data-tone`: `note`, `tip`, `warning`, `danger`.

## Tokens consumed

`border.*` and `fg.*` for the tone; `bg.surface`.

## Accessibility

`role="note"` (or an `aside` with a name from the title). The tone is in the
title text, so it is heard, and the mark beside it is `aria-hidden`.

## Acceptance criteria

- [x] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [x] Styled from `data-*` state and semantic tokens only
- [x] Stories cover every state, and run as Vitest browser tests
- [x] axe passes; keyboard walkthrough recorded in the story
- [x] Light, dark and forced-colors verified
- [x] Metadata written: props, anatomy, when to use, when not to
- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [x] Both painters render it identically, measured in cells
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [x] Conforms at `strict`, or declares its exception with a reason
- [x] Draws every state from the state vocabulary (0118), and no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal in its source
- [x] Rendered by the cell renderer (0117): continuity passes at all four densities
- [x] One export line in `packages/react/src/index.ts` and one import line in `packages/css/src/index.css`, as 0122 sets out
- [x] Tone is carried by border weight and a mark as well as colour
- [x] `> [!NOTE]`, `[!TIP]`, `[!WARNING]` and `[!CAUTION]` in the site's Markdown render as callouts

## 2026-10-03

Callout is a Screen whose content layer is in the page's flow (.rk-callout > .rk-content is position: relative, white-space: normal), so the content decides the height and the screen measures it and redraws the frame to fit; across, the content layer is round(down, 100%, cell), the CSS spelling of the screen's own floor(width / cell), so the frame and the prose agree on the column. role=note, aria-label the title. Tones are weight + mark + colour: note single/●/accent, tip rounded/✓/success, warning heavy/!/warning, danger double/✗/danger titled Caution (GitHub's word). The marks are Badge's for the same tones. Under an ascii theme the border is ascii and the marks carry the tone. A callout never scrolls, so 0207 asks nothing of it; the Fits story asserts scrollHeight equals clientHeight.

## 2026-10-03

The site cannot hydrate a Screen inside prose: a page of prose runs no script at all (site.test). So Markdown alerts become the static callout, .rk-callout-static: a grid of a cell, the content and a cell, with corners as one-cell shapes and each edge as one shape stretched along its side, stroked by the cell renderer from the junction table exactly as prose blockquotes and diagrams already are. The chrome (weight, heading, label, colours) comes from calloutChrome in @rockaway/react/callout, the same data calloutBuffer draws, so the two cannot drift. rehypeCallouts (apps/site/src/lib/markdown.ts) runs after rehypeCellGlyphs and handles NOTE, TIP, IMPORTANT (a note titled Important), WARNING and CAUTION. docs/concept.md's 'breaking it quietly' paragraph is now a [!NOTE], which the site test reads back on a phone: a note named Note, eight hidden shapes, sides as tall as the wrapped content, whole rows, still no script.

## 2026-10-03

Two things learned on the way. screenshot() wrote a wrapped text node as one long run from its first cell, so it could not read prose; it now writes each line of a wrapped node where that line is (by grapheme rects), and leaves single-line text as before. And a frame that follows its content is a frame behind it: font, cell, rewrap, remeasure, redraw. The stories wait for that (fitted()) rather than asserting after two frames. Not interactive, so criteria 1 and 11 hold by having nothing to operate; the keyboard walkthrough shows Tab passing through to the links inside in reading order. 'Every tone' is pinned to strict. The workbench has no story for the static form: the site test is its proof, in a real build, and it shares calloutChrome with the component.

## Result

Callout: a Screen-drawn frame that fits its in-flow prose, tones as weight + mark + colour; Markdown alerts become .rk-callout-static, the same chrome drawn by the cell with no script.
