---
id: 104
uid: 562ba731-e93f-474e-a13e-938b31be29ad
title: Build the site shell as a TUI
type: feature
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 98
- 103
- 126
- 135
- 136
- 137
- 141
- 143
created: 2026-09-22
updated: 2026-10-09
closed_at: 2026-10-09
priority: p0
layer: site
effort: l
---

## Proposal

Panes, a status bar, a navigation tree and keyboard navigation — built from the
system's own components, because that is the whole argument.

## Acceptance criteria

- [x] Split panes (0136): navigation (a Tree, 0137), content, and a context pane that collapses under 80 cells; at 40 cells the panes stack
- [x] `j`/`k` and arrows move; `?` shows help generated from the keymap (0141); `g` then a letter jumps
- [x] Every keyboard route is also an ordinary link, so it is a website first and a TUI second
- [x] The status bar (0098) says where you are and what the keys do
- [x] Landmarks (`nav`, `main`, `complementary`) and a skip link, and the URL is the state: every pane's selection is linkable
- [x] Markdown content is set by the prose styles (0143) with no per-page CSS
- [x] No component that is not in `@rockaway/react`: if the site needs it, the system grows it

The palette's `⌘K` and `/` live in 0149, so the shell does not wait for 0102.

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Paused 2026-10-03 at WIP commit on feat/site-shell (pushed, no PR; it carries Panes #101 and StatusBar #102 merged locally until they land). Built: NavigationTree/NavigationTreeItem grown into the system's Tree (labels are real links, current page is the selected row), the shell island (Panes: map, page, outline; StatusBar; Keymap with j/k/arrows/space/gg/G/g-letter/?/esc), outline read from rendered HTML, a scripting:none document fallback, hide-until-measured with a 3s reveal. Open: site.test.ts conformance fails on component pages now that prose sits inside the panes' screen (prose table columns read 0.3 cells off the screen's grid); shell tests not yet written; no changeset yet for the Tree addition.

## 2026-10-03

Resumed and built out. Putting every page inside a screen holds the whole page to the grid, which found four things. (1) Table.astro emitted a bare table; in a pane narrower than its sized columns, the anonymous table inside a display:block table shrank them to fractional pixels (the 0.3-cell offset). It is now wrapped in .rk-scroll-marks, as the Markdown pipeline wraps tables. (2) A painted row wrapped in prose when wider than the measure: .rk-row is white-space: pre now (css patch), and Painted scrolls across in its own box. (3) List's empty mark cells had no height and sat half a row down: .rk-list-mark is a whole cell tall (css patch). (4) Form's sketch Input is the browser's width; its example is excused with data-rk-offgrid until Text field (0035). Continuity over a scrolled snapshot needs #151 (continuity in scrolled regions), merged locally like #101 and #102.

## 2026-10-03

Design: the context pane collapses below about 94 cells (nav 26, content at least 36, outline 28, and the borders), so it is certainly gone under 80, as the criterion asks, and the page keeps a readable measure in between. The panes stack below 64. The panes are unnamed sections (an empty label) so nav, main and aside stay top-level landmarks; 0248 lets a Pane opt out properly. The skip link is site CSS until 0249. A scrolling pane's position is in the status bar until 0250 puts it in the border. The Astro base read is 0241.

## 2026-10-03

Not yet a PR: it carries Panes (#101), StatusBar (#102) and continuity in scrolled regions (#151) merged locally. StatusBar's example shows no words without script (its segments are hidden until measured); reported to the CTO for #102. The no-JS example test fails on it until that is fixed.

## 2026-10-03

Rework, approved by the CTO: the site's chrome runs on the system's pure halves, not React. Measured: the shell as a React island ships 159 kB gzipped on every page (React DOM 65, React Aria's Tree about 40, the rest ours), and no React shell gets under QA's 100 kB budget (#178). The same shell as server-rendered HTML (Panes, StatusBar, KeyHint, Button, rendered by Astro with no client directive) plus a plain-TypeScript runtime built only from the pure halves (layoutPanes, fitStatus, paintCells/rowRuns, the grid engine, the keymap engine, @rockaway/react/copy) measures about 20 kB gzipped in esbuild, so about 25 kB with the runtime's own code. React then loads only on pages with a React demo. Conditions: no drift (a test proves the runtime's repaint of Panes, StatusBar and the keymap help equals the component's server render at the same size, cell for cell); the static link tree is a system component (server-only, painted guides, metadata, page, stories), which replaces NavigationTree (dropped as unused); the keymap engine is exported from its pure half in #146; KeymapHelp takes bindings on this branch. A treegrid rendered without hydration would be a broken ARIA promise, so the map and the outline become nested lists of links, which need no script. Lost: arrow keys inside the map (Tab works). A decision item for this is coming in batch 9.

## 2026-10-03

Reworked as approved: the shell is the system's components rendered by Astro with no hydration, laid out by @rockaway/react/dom (measureScreen, relayoutPanes, fitStatusBar: the DOM halves, new) and keyed by the keymap engine from #146 (merged locally). The map and the outline are LinkTree (new system component: a nested list of real links with Tree's guides, server-only, metadata, page and stories); NavigationTree is dropped. KeymapHelp takes bindings, so the help screen renders on the server from the list the script binds (src/lib/shell.ts holds the panes, segments and keys once, for both). No drift: apps/workbench/src/grid/Static.stories.tsx lays out Panes and StatusBar both ways at the same sizes and compares the chrome node for node, the text cell for cell and the placements; KeymapHelp from bindings equals KeymapHelp from a live keymap. A page of prose now loads about 25 kB gzipped of script, with no React; the site test holds it under 40 kB. When #190 lands, LinkTree's cut label should use its theme ellipsis rather than CSS text-overflow (the font's …), as the CTO asked; LinkTree renders on a server, so that wants a server-safe form of the cut.

## 2026-10-09

Rebuilt for Next.js in apps/web without Panes or StatusBar as client components: the grid is CSS, borders are server-drawn elastic frames, so the shell's first-load JS is the Next floor plus a ~7.7 kB island (shared 136.9 kB gz, was 188). Panes/StatusBar stay the system's for apps that measure; the site cannot afford their script on every page.

## 2026-10-09

Done in apps/web (#245). Criterion 7 holds in spirit and not in letter: the shell's chrome is the system's pure halves (frameBuffer, chromeRows, treeGuides, rowRuns) and its stylesheets, rendered on the server, not the Panes and StatusBar components, whose measuring script the site cannot afford on every page (188 kB shared before, 140 after). The system tickets that would let a site use the components themselves: 0303 (server entries) and a status bar laid out by CSS (proposed).
