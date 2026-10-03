---
id: 207
uid: c70d26f3-1996-43ff-93d7-afbe304bef8b
title: 'No native scrollbars: a scroll position is drawn in cells'
type: decision
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: css
effort: s
---

## Context

The owner, looking at the workbench in a real browser: "there are sometimes two
scrollbars in the UI — we cannot use the native scrollbar for this concept", and
List stories "often say off the grid". Both have one cause. List's viewport is a
native `overflow: auto` box, so the browser draws its own scrollbar beside the
one List draws in cells, and with classic (non-overlay) scrollbars that native
bar takes about 15px from the box, which leaves every row a fraction of a cell
wide. Prose code blocks and tables (0143) scroll natively too.

The tests never saw it: headless Chromium hides scrollbars, so the native bar
measured 0px wide in every story run. Only a reader with a mouse attached, or
"always show scroll bars", meets it.

## Options

- Keep native scrollbars and style them. A browser scrollbar is drawn in
  pixels by the platform; it cannot be made a cell, and where it takes space it
  pushes everything off the grid.
- Hide every native scrollbar and show the position in cells.

## Decision

**No native scrollbar is ever drawn.** Every scrolling region in the system
hides the browser's bar (`scrollbar-width: none`, and the WebKit pseudo-element)
and shows its position in cells: a drawn scrollbar column for a viewport that
scrolls by rows (List, CodeBlock vertically), overflow marks `‹ ›` for a region
that scrolls across (code, tables, Tabs). Scrolling itself is untouched: wheel,
touch, trackpad and keyboard all still work, and a scrollable region keeps the
tab stop axe asks for.

## Consequences

The check cannot be "measure the bar", because headless hides it. It is: every
element whose computed `overflow` scrolls must have `scrollbar-width: none`,
checked after every story like conformance. Add a classic-scrollbar browser run
if Chromium can be made to show them.

## 2026-10-03

Built in 0208. Classic scrollbars can be forced in headless Chromium by dropping Playwright's --hide-scrollbars default (ignoreDefaultArgs) and turning overlay scrollbars off; a native bar then measures 15px on macOS. The workbench has a classic-scrollbars project for it.
