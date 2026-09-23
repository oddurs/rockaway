---
id: 71
title: Build the engine as pure geometry with pluggable painters
type: decision
status: done
milestone: grid
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Context

A frame has to be drawable as characters, as CSS rules, as ANSI and as plain
text for snapshots. Four renderers that each know how to draw a box is four
things to keep in agreement.

## Options

- **One renderer, characters only** — simplest, and it gives up crisp hairlines, print, and any future canvas
- **A renderer per target, each with its own geometry** — they drift on the first junction bug
- **One geometry, several painters** — the geometry is pure integers and testable without a browser

## Decision

One geometry, several painters. Decided 2026-09-23.

- **`@rockaway/grid`** is a new package: no DOM, no React, no CSS. It holds the cell buffer, rectangles, the box and junction model, text measurement, and an integer layout solver. Everything in it is a pure function of its inputs.
- **Painters** take a finished buffer and put it somewhere:
  - `text` — a string, for snapshots, `README`s and copy-to-clipboard
  - `glyph` — DOM spans of box-drawing characters, `aria-hidden`
  - `rule` — CSS hairlines on the cell boundary, for people who want crisp lines
  - `ansi` — escape sequences, for a terminal or a CLI demo
- **`@rockaway/react`** binds the two: it measures the container in cells and hands the geometry to a painter.

## Consequences

- The hard parts (junctions, wide characters, distribution of leftover cells) are tested in milliseconds, in Node, with no browser
- A new painter is additive and cannot change what a screen *means*
- The packages become: `grid` (geometry), `tokens` (data), `css` (contract), `react` (bindings), plus the site
