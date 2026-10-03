---
id: 126
uid: 65f41f08-5f6f-4841-aeb7-c074ec688d82
title: Paint a screen's chrome on the server, so the first paint needs no JavaScript
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 86
- 117
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: grid
effort: m
---

## Problem

`Screen` renders an empty `.rk-frame` and paints into it imperatively in a
layout effect. On a server, and in a page whose JavaScript has not loaded,
there is no chrome at all. The concept's "a static page with no JavaScript
gets chrome" is not true today, and the site (0077, 0108, 0109) promises a
live screen that "works before JavaScript loads".

## Proposal

After 0117 settles how a cell is rendered, make the painter able to produce
markup as well as mutate a node: Screen renders the buffer as elements during
render (at `cols` × `rows` when fixed, at `fallback` when measured), and the
client keeps the same nodes on hydration, then remeasures and repaints only if
the measured size differs.

## Acceptance criteria

- [x] `renderToString(<Frame cols={40} rows={5} title="x" />)` contains the painted chrome, character for character the same as `toText`
- [x] A fixed-size screen hydrates with no mismatch warning and no repaint
- [x] A measured screen renders at its fallback on the server, and corrects to the measured size on the client without a layout shift outside its own box
- [x] A story renders a server-rendered screen with scripts disabled and asserts its text snapshot
- [x] The concept's "Where it is thin" entry about static pages is rewritten to say what is now true
- [x] The pure buffer functions (`frameBuffer`, `dividerBuffer`, `drawRule`, `scrollbarBuffer`, `formatKeys` and the rest) live in modules without `'use client'`, so a server component or text renderer can call them; the component files import them
- [x] Before it is measured, `Screen` sizes its cell from `1ch` and `1lh`, not a fixed 8.4×20px, so a server-rendered screen with fixed `cols` does not change width when it hydrates
- [x] Painted chrome is server-rendered from `rowRuns`, which is pure, so the first paint already carries the cell renderer's shapes and the client hydrates the same runs

## 2026-10-03

Screen renders its chrome as elements: chromeRows(buffer) in packages/react/src/paint/chrome.tsx, built on the same runMarkup the DOM painter (paintCells) writes, so a server-rendered screen and a client-painted one are the same nodes. The layout-effect paint is gone; the rows are memoised on the buffer, and measurement only updates state when the cell or size actually changed, so a fixed-size screen hydrates with no repaint (Grid/Screen › Hydrates without a repaint checks node identity, no recoverable errors and width). Before measuring, the cell vars are 1ch/1lh; checkConformance and screenshot now resolve the cell by laying out a one-cell probe (testing/cell.ts) rather than parsing the property, so they read an unmeasured screen correctly. Pure halves: each component's buffer and formatting functions moved to components/<name>.pure.ts (no 'use client'), with the option types left in the component files and imported as types, so the metadata extractor still expands them; the barrel lists each pure module on its own line, and the barrels test now only counts .tsx lines as components. test/server-component/render.ts calls frameBuffer, dividerBuffer, scrollbarBuffer, formatKeys and buttonBuffer under react-server. The List scrollbar renders as Chrome too, so it is on the server (glyphs.test's server text gained its thumb). No-JS proof: a Vitest command loads the markup in a context with javaScriptEnabled: false, checks the page's own script did not run, and reads the rows (Grid/Screen › Paints with JavaScript off).

## Result

Screen renders its chrome as elements from rowRuns, so a server sends it and a page without JavaScript shows it; the cell starts at 1ch × 1lh, and the buffer functions live outside the client boundary.
