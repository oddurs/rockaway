---
id: 115
uid: d279648b-33e5-4215-9379-5d2dcc564978
title: Virtualise the list by row
type: feature
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 133
created: 2026-09-23
updated: 2026-10-03
priority: p2
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

- [x] A thousand rows, and only the visible ones plus overscan in the DOM
- [x] Home, End and the page keys reach the ends of the collection, not the viewport
- [x] Type-ahead reaches a row that was never rendered
- [x] The keyboard story passes unchanged, with virtualisation on
- [x] If the defect is React Aria`s, the issue is linked here

## 2026-10-03

The End and Home failure the ticket records doesn't reproduce with React Aria Components 1.21.1. With Virtualizer and ListLayout around ListBox, End focuses the collection's last row, Home the first, page down moves a page, and type-ahead '07777' focuses row 7777, none of them rendered beforehand. The Ten thousand rows story asserts each, with fewer than 60 options in the page. No upstream issue to link; whatever it was is fixed in the version we're on.

## 2026-10-03

Three things virtualisation broke, and what fixed them. (1) Snapping: with 'mandatory', a scroll far past the rendered rows (scrollTop to the bottom of a thousand) snapped back to the last rendered row, because rendered rows are the only snap points. Now 'proximity': the jump lands, the virtualiser renders the rows there, and they snap it to a whole row (asserted at 5000.4 rows). Proximity doesn't re-snap after a layout change, so List now keeps its top row across a density change itself: it measures the cell, ignores the browser's own scroll moves while the rows change height, and puts the row back. (2) Scroll anchoring moved the position when the matrix switched to dark: overflow-anchor: none on the box, since the virtualiser places every row. (3) The Keyboard story's select-all counted selected rows in the DOM, which only holds the rendered ones; it now checks that every rendered row is selected.

## 2026-10-03

Environment: react-stately reads process.env.VIRT_ON at run time when NODE_ENV is 'test' (its jsdom escape hatch), and a browser has no process. A define in vitest.config didn't reach every project's pre-bundled copy (p3 and forced-colors still threw), so .storybook/vitest.setup.ts gives the browser a process with VIRT_ON set. The changeset tells consumers to do the same if they test List in a real browser. Row height is measured with measureCell on the list's host, before first paint, with DEFAULT_CELL as the fallback (so the virtualiser never lays out zero-height rows and renders everything), and again by ResizeObserver: a new density changes the list's box, since it is a number of rows tall.

## 2026-10-03

Criterion 4 (the keyboard story passes unchanged) is left unticked. The story passes, but one assertion had to change: after select-all it counted selected rows in the DOM, and a virtualised list only has the rendered ones there. It now checks that every rendered row is selected. Everything else in the story is unchanged. Criterion 5 is ticked as not applicable: there is no React Aria defect to link, since it doesn't reproduce on 1.21.1.

## 2026-10-03

Criterion 4, ruled on by the CTO: the intent is that keyboard behaviour is unchanged, not the assertion's text. Select-all used to count selected options in the DOM; virtualised, the DOM holds only the rows near the viewport, so that count proves less than it did. The Keyboard story now reads the selection itself through onSelectionChange: after mod+a it must be 'all', or a Set holding every one of the FILES keys, and every rendered row must draw it. That proves the same behaviour as before, through the selection rather than the page, so the criterion is ticked. Everything else in the story is untouched.

## 2026-10-03

Snapping, checked for short lists: the switch to proximity applies to every List. A new Wheel story turns the real mouse wheel (a Playwright command, run.wheel) over a 12-row list at all four densities, by a 100px notch, 1.4 rows and 0.6 rows, and asserts it comes to rest on a whole row above the top. It passes, and fails with snapping off, so it discriminates: with snap points one cell apart every position is near one, so proximity snaps a short list as mandatory did. Mandatory stays off.

## 2026-10-03

The process catch is recorded in List's metadata under a new optional knownIssues field (schema.ts, meta.schema.json, assembly). The line: react-stately 3.50.0 dist/private/virtualizer/Virtualizer.mjs:144, and Rect.mjs:61, both 'let isTestEnv = process.env.NODE_ENV === "test" && !process.env.VIRT_ON;'. Proposed a follow-up to the CTO: report it upstream, asking for typeof process guards.
