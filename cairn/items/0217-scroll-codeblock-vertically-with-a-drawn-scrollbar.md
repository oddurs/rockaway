---
id: 217
uid: 1678246c-fc00-438d-8940-fccb47eadc61
title: Scroll CodeBlock vertically with a drawn scrollbar
type: feature
status: backlog
milestone: primitives
depends_on:
- 138
- 207
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## Problem

A CodeBlock is always as tall as its code. A long file needs a viewport that
scrolls by rows, with its position drawn in cells (0207).

## Acceptance criteria

- [ ] A `rows` prop caps the height; the code scrolls by whole rows with a cell-drawn scrollbar and no native bar
