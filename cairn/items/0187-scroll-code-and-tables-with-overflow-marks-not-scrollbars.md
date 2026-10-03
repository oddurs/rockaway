---
id: 187
uid: bc5b9fce-f2aa-4cfe-b254-3735a1239b60
title: Scroll code and tables with overflow marks, not scrollbars
type: feature
status: dropped
milestone: site
depends_on:
- 143
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: css
effort: s
---

## Problem

On Windows and Linux a classic scrollbar adds its own pixels to a scrolling code
block or table, which puts everything after it off the grid. Raised by the site
lead (0143).

## Acceptance criteria

- [ ] Scrolling prose blocks hide the scrollbar and draw `mark.overflow-start`/`-end` at the edge with more, the way `less -S` does
- [ ] They stay keyboard-scrollable and announce that they scroll

## 2026-10-03

Absorbed by the native-scrollbar ticket filed with decision 0207: overflow marks for horizontally scrolling prose are one of its criteria.
