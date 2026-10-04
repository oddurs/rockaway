---
id: 218
uid: f3c64835-8cb6-4037-891d-de6abb33cdec
title: Show overflow marks where scroll-state queries are missing
type: feature
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 208
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: css
effort: s
---

## Problem

The `‹ ›` overflow marks (0208) use scroll-state container queries, which only
Chromium has, so Safari and Firefox readers lose the "there is more" cue.

## Acceptance criteria

- [x] A small script (or a scroll-driven-animation fallback) sets the same state, so the marks show in every engine

## 2026-10-03

Claimed past 0208 (in review, only its docs criterion open) because the marks it adds are on main and this builds on them. Fallback: watchOverflowMarks() in @rockaway/react (no React in it) writes data-rk-more=start/end on .rk-scroll-marks and .rk-prose pre where CSS.supports('container-type','scroll-state') is false; scroll.css shows the marks from that attribute as well as from the query. Scroll events captured at the root, a ResizeObserver on each region and its content, a MutationObserver for regions added later. No JavaScript: no marks, region still scrolls, as before. Table calls it on its own region; the site's Document layout runs it (about 1KB inlined). Proved: Prose 'Overflow marks, without the query' sets container-type: normal on the regions so no query can match in any browser, and checks no marks without the script, the marks following the scroll with it, nothing left after stopping it. In real Firefox (local engine config): on main, Table/Scrolls and Prose/Overflow marks fail; with this both pass. Prose 'At forty cells' fails in Firefox on main too (inline code/strong/em/a off the grid) and is left for its own ticket.
