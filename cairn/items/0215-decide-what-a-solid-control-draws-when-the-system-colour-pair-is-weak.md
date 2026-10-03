---
id: 215
uid: 7964f4d8-ca91-45ae-bc32-e7caf8177208
title: Decide what a solid control draws when the system colour pair is weak
type: decision
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: css
effort: s
---

## Context

Firefox's emulated forced-colours palette pairs HighlightText `#fff` with
Highlight `#3399ff`, 2.94:1, and a solid button is drawn in that pair. Known
entry `firefox-forced-highlight` (0124).

## Options

- Ours to fix: draw solid controls in CanvasText/Canvas, which forced colours guarantee.
- The reader's palette to own: forced colours is the reader's choice of colours.

## Decision

To be made; either way the known entry comes out.
