---
id: 111
title: Render in the DOM, and treat painting as a strategy
type: decision
status: done
milestone: primitives
created: 2026-09-23
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: grid
effort: m
---

## Context

A TUI on the web can be built four ways. The choice is not cosmetic: it decides
what the system *is*, and it has to be recorded, because every later argument
about painters, snapshots and accessibility appeals back to it.

## Options

| Route | Examples | What it costs |
| --- | --- | --- |
| Paint the grid to canvas or WebGL | xterm.js, GPU terminal emulators | The DOM: no accessibility tree, no native focus, no selection, no forced-colors |
| Type box characters into HTML | terminal-aesthetic sites | A costume: breaks on wrap, zoom and selection, and has no interaction model |
| Stream a real TUI into a page | textual-web, ttyd, gotty | A terminal *in* a page, not a page: needs a server, and pays latency |
| Keep the DOM, constrain the geometry | rockaway | Paint cost, and a grid you have to hold yourself to |

## Decision

The fourth. Semantics stay in the DOM; only the *geometry* is constrained to the
character cell. A frame is described once, in the pure engine, as edge weights
per cell, and a **painter** turns that description into output. Four exist:
glyphs, CSS hairlines, plain text, ANSI.

Three rules follow, and they are the ones to defend:

1. **A painter never invents geometry.** It reads the buffer and draws. A screen
   measures the same in cells whichever painter drew it, which is what makes
   the text snapshot a valid test of the CSS-painted page.
2. **Chrome is `aria-hidden`; content is real elements.** Two layers. A screen
   reader hears a button, not `┌────┐`. No accessible name ever contains a glyph.
3. **The buffer is the oracle.** Because the engine is pure and paints to text,
   the test for how a screen looks is a diffable picture of it.

## Consequences

Easy: accessibility, zoom, selection, forced-colors, i18n, and tests that read
like the thing they test. A theme is the ANSI 16, so it is also a real terminal
theme.

Hard: paint cost is ours to carry — per-cell DOM nodes, coalesced where we can.
A canvas painter stays available precisely because painting is a strategy, and
it would be the escape hatch if a dense page ever needs one.

Revisit if: a real page cannot hold 60fps with the DOM painters, or a platform
we care about cannot do `1ch`/`1lh` arithmetic reliably.

## 2026-09-23

Recorded after the fact: the choice was made during the grid milestone and implemented in 0079, 0085 and 0086, but never written down as a decision — 0070 is the positioning and 0085 is the feature. The reasoning is now here, and docs/concept.md (0112) is its public form.
