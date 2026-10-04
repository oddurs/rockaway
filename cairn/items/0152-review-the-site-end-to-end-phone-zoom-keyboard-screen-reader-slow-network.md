---
id: 152
uid: 2c742ddc-d635-4612-989f-554747f9b128
title: 'Review the site end to end: phone, zoom, keyboard, screen reader, slow network'
type: chore
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-04
depends_on:
- 104
- 105
- 106
- 107
- 108
- 109
- 113
- 146
- 147
- 148
- 149
- 150
- 151
created: 2026-10-03
updated: 2026-10-04
priority: p0
layer: site
effort: m
---

## Problem

Each site item proves its own part. Nobody has used the whole site the way the
launch audience will: on a phone on a train, zoomed, from the keyboard, with a
screen reader, on a slow connection, in Firefox and Safari.

## Acceptance criteria

- [x] Every page at 320px wide and at 400% zoom: no horizontal scroll except tables and code, nothing clipped
- [x] The whole site navigated by keyboard alone, every route reached, focus always visible
- [ ] The landing page and one component page used with VoiceOver on iOS and macOS, findings recorded here
- [x] First load on a throttled "Slow 4G" profile: the landing page's first paint and its live screen time recorded here
- [x] Chromium, Firefox and Safari checked; any difference fixed or recorded
- [ ] Every finding fixed or filed as a `bug` linked here

## 2026-10-03

From 0143: confirm in Safari VoiceOver that display:block tables keep their table semantics (they do in Chromium).

## 2026-10-04

Reviewed on the full stack (shell, copy, landing, switcher, cards; branch feat/cards) on 2026-10-04, by script where a script can look (apps/site/.scratch/review.mjs, not committed) and in the site test where it should stay. 320 px, which is also 1280 at 400%: every page now fits. Fixed in feat/cards: component examples, the landing page's hello frame and the themes page's swatch rows scroll across in their own focusable region instead of being clipped by the pane, and the 404 screen is 26 cells. A site test holds every page to 320 px (no page scrolling across, nothing wider than the page pane outside a scroller, panes stacked).

## 2026-10-04

Keyboard: every one of the 28 pages tabbed through at 1280 in Chromium. The first stop is the skip link, then the map's links, then the page. Focus is visible on every stop (a ring, or the link tree's cursor mark). One soft finding: focusing the Table page's tall props table scroller can leave its top above the view.

## 2026-10-04

Slow 4G (Chromium throttled: 150 ms RTT, 1.6 Mbit/s down; 390 px; cache off): landing page first paint 572 ms, shell live (its first contentful frame) about 944 ms; a component page 540 ms and about 1,106 ms. Until the script has measured the window the shell is hidden (ground colour only), so the first contentful paint waits for the 25 kB module. Proposed: modulepreload the shell script, or decide a fallback first frame.

## 2026-10-04

Engines: Chromium, Firefox and WebKit all lay the shell out at 133x32 cells at 1280x800 with no overflow, and the same chrome. Difference: at 1x, Firefox and WebKit draw the light stroke (0.08em = 1.28 px) 2 px wide where Chromium draws 1 px, so frames look heavier there. Recorded; 0263 measures the paint figures in Firefox and WebKit. React error 418 (hydration) on the KeyHint page in every engine: KeyHint's and Link's visually hidden words were divs inside a paragraph; fixed in #200.

## 2026-10-04

Not done by a machine: VoiceOver on iOS and macOS needs a person. Chromium's accessibility tree, checked instead, has navigation 'Site', main, complementary 'On this page' and region 'Status' (the panes are still nameless sections around them until #179's landmark={false} lands), headings in order, figures and the drawing named, and the look and copy buttons named 'Theme: default', 'Copy the screen as text' and so on.
