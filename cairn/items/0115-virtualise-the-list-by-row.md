---
id: 115
title: Virtualise the list by row
type: feature
status: backlog
milestone: primitives
created: 2026-09-23
updated: 2026-09-23
priority: p1
layer: components
effort: m
---

## Problem

`List` (0100) renders every row. That is fine for a file list and wrong for a
log. React Aria ships `Virtualizer` and `ListLayout`, and they do render only the
rows near the viewport — but a keyboard jump to a row they have not rendered
leaves focus nowhere, and a list you cannot reach the end of is worse than a list
that renders too many rows. So virtualisation came out again.

## What was tried, so the next attempt starts further on

- `<Virtualizer layout={new ListLayout({rowHeight: measuredCell})}>` around
  `ListBox`. It virtualises: the sizer is the full height and only ~10 rows of a
  thousand are in the DOM.
- `ArrowDown` works, and so does type-ahead to a row inside the overscan.
- `End` does not. Focus stays on the previously focused row, the viewport scrolls
  by the two rows needed to show the last *rendered* row, and no row carries
  `data-focused`. `Home` from there has the same problem in reverse.
- Not caused by: `scroll-snap` on the viewport (removed, no change); an `onScroll`
  prop shadowing the virtualiser`s own handler (now a native listener, no change);
  static children versus the dynamic `items` collection API (no change).
- Two environment notes for whoever picks this up. react-stately reads
  `process.env.NODE_ENV` from a nested ESM file that dependency optimisation does
  not reach, so the browser needs `define: {"process.env.NODE_ENV": ...}` or it
  hits a bare `process`. And under `NODE_ENV=test` it renders the whole
  collection on purpose, because jsdom has no layout — `process.env.VIRT_ON` is
  the switch react-stately ships to turn virtualisation back on, and our browser
  tests need it or they assert nothing.

## Proposal

Work out whether the focus loss is ours or React Aria`s, upstream it if it is
theirs, and put the `Virtualizer` back. The scrollbar already takes a row count
rather than the DOM, so it needs no change.

## Acceptance criteria

- [ ] A thousand rows, and only the visible ones plus overscan in the DOM
- [ ] Home, End and the page keys reach the ends of the collection, not the viewport
- [ ] Type-ahead reaches a row that was never rendered
- [ ] The keyboard story passes unchanged, with virtualisation on
- [ ] If the defect is React Aria`s, the issue is linked here
