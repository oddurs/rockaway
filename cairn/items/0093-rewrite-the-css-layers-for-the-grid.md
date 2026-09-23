---
id: 93
title: Rewrite the CSS layers for the grid
type: feature
status: done
milestone: retheme
assignee: Oddur Sigurdsson
depends_on:
- 90
- 91
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: css
effort: l
---

## Acceptance criteria

- [x] The base layer sets the monospace rhythm: one size, line box from the density, ligatures off
- [x] Focus is reverse video on filled controls and the outline elsewhere, both contrast-checked
- [x] Selection, placeholder and disabled read as attributes, not as new colours
- [x] Forced colors maps onto the ANSI roles, keeping 0027's promise
- [x] Cell utilities and the container-query steps at 40, 60, 80 and 120 cells

## 2026-09-23

One bug introduced and caught here: setting color-scheme in the base layer overrules the mode context, because base is later than tokens, so form controls rendered in the light scheme inside a dark page. axe found it as a 1.19:1 contrast failure on a number input. color-scheme belongs to the mode context, and the file now says so.
