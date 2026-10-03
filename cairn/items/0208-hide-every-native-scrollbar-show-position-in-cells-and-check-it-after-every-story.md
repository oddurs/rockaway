---
id: 208
uid: 5dc4f0bc-eb02-41d2-a069-135c3bb8f210
title: Hide every native scrollbar, show position in cells, and check it after every story
type: bug
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 207
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: css
effort: m
---

## What happens

0207. List draws two scrollbars and goes off the grid with classic scrollbars;
prose code and tables scroll natively; CodeBlock (#103) and Tabs (#104) are in
review and must follow the same rule.

## Acceptance criteria

- [x] One shared rule in `@rockaway/css` hides the native scrollbar on every scroll region (`scrollbar-width: none` plus `::-webkit-scrollbar`), and List, prose code blocks and prose tables use it
- [x] A check after every story fails any element whose computed overflow scrolls without `scrollbar-width: none`, with a fixture proving it fails
- [x] A run with classic scrollbars forced on, if Chromium allows it, shows List conforming and one scrollbar only; if it cannot be forced, the item says why
- [x] Horizontally scrolling prose shows `mark.overflow-start`/`-end` at the edge with more (this absorbs 0187)
- [ ] `docs/concept.md` states the rule, and the recipe (0134) says how a new scroll region shows its position

## 2026-10-03

Shared rule: packages/css/src/scroll.css. rk-scroll hides the bar (scrollbar-width: none plus ::-webkit-scrollbar). rk-scroll-marks also draws overflow marks. The same rule names .rk-prose pre and table, because Markdown cannot carry a class. List's viewport has rk-scroll, and so does the workbench token reference, which the new check caught. CodeBlock and Tabs adopt rk-scroll (and rk-scroll-marks for anything that scrolls across).

## 2026-10-03

Classic scrollbars can be forced. Playwright launches headless Chromium with --hide-scrollbars, which is why every bar measured 0px. A fifth workbench project, classic-scrollbars, launches with ignoreDefaultArgs: ['--hide-scrollbars'] plus --disable-features=OverlayScrollbar. A native vertical bar then measures 15px, on macOS too. Before the fix, 9 of 17 List and Prose stories failed conformance there, which reproduces the owner's report. Without rk-scroll on List's box, Grid/Scrollbars > With classic scrollbars sees 15px taken. With the fix, all pass. Stories tagged classic-scrollbars run there: List, Prose and Grid/Scrollbars. The project defines import.meta.env.RK_SCROLLBARS, so its story asserts that bars really are drawn and could not pass vacuously if the flag stopped working.

## 2026-10-03

Overflow marks are CSS only. The region is a one-column grid as wide as its content (grid-template-columns: max-content). ::before and ::after are sticky at its two edges, and a scroll-state container query (scrollable: inline-start/end) shows each mark only while there is more past it. Content alt text is empty, so the marks are not read. Sticky is held inside the scroller's padding, and a negative inset-inline-end does not engage in Chromium, so prose pre moved its inline padding onto code and the marks land on the outermost cells. A table is several boxes and cannot be the grid, so a table is wrapped (div.rk-scroll-marks tabindex=0) and the wrapper scrolls. The site's rehypeScrollable now wraps tables, and the workbench fixture does the same. Prose > Overflow marks checks start, middle and end. Where scroll-state queries are unsupported (only Chromium has them today), no mark shows and the region still scrolls.

## 2026-10-03

Criterion 5 is half done. docs/concept.md has section 10, and CONTRIBUTING's Adding a component says how a new scroll region shows its position. The recipe (0134) does not exist yet, so it is unticked; 0134 has a note to carry it. The check reads computed style, not pixels (0207), and it covers the story's canvas only, not the workbench page around it.
