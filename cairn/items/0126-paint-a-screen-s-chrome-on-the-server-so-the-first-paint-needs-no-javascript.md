---
id: 126
uid: 65f41f08-5f6f-4841-aeb7-c074ec688d82
title: Paint a screen's chrome on the server, so the first paint needs no JavaScript
type: feature
status: backlog
milestone: primitives
depends_on:
- 86
- 117
created: 2026-10-03
updated: 2026-10-03
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

- [ ] `renderToString(<Frame cols={40} rows={5} title="x" />)` contains the painted chrome, character for character the same as `toText`
- [ ] A fixed-size screen hydrates with no mismatch warning and no repaint
- [ ] A measured screen renders at its fallback on the server, and corrects to the measured size on the client without a layout shift outside its own box
- [ ] A story renders a server-rendered screen with scripts disabled and asserts its text snapshot
- [ ] The concept's "Where it is thin" entry about static pages is rewritten to say what is now true
- [ ] The pure buffer functions (`frameBuffer`, `dividerBuffer`, `drawRule`, `scrollbarBuffer`, `formatKeys` and the rest) live in modules without `'use client'`, so a server component or text renderer can call them; the component files import them
