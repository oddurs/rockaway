---
id: 149
uid: 7387c41e-f5a2-4bce-8d51-1a95f728e12f
title: Index every page for the command palette at build time
type: feature
status: backlog
milestone: site
depends_on:
- 102
- 104
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: site
effort: s
---

## Problem

The palette is the front door of the site (0102: "the thing the site is
judged on"). It needs something to search, and 0104's `⌘K` / `/` criterion
needs a palette to open.

## Acceptance criteria

- [ ] A search index of every page, heading and component is built statically and loaded only when the palette first opens
- [ ] `⌘K` and `/` open the palette from any page; results are pages, sections and commands (theme, density, copy screen)
- [ ] Results reach a heading within a page, not only the page
- [ ] The index's size is printed by the budget check (0109), and does not count against the first page's JavaScript
