---
id: 124
uid: e7288c0c-adba-45d8-9122-a4536b049934
title: Run the story tests in Firefox and WebKit as well as Chromium
type: chore
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 13
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: m
---

## Problem

Every story test, the conformance check and axe run in Chromium only. The
system's claims are about the cell (`1ch`, `1lh`, font metrics, line boxes),
which is exactly where engines differ, and the people this launches to use
Firefox and Safari in numbers.

## Acceptance criteria

- [x] The workbench Vitest config has Chromium, Firefox and WebKit projects, and forced colors is tested in every engine that implements it, with the reason for the others written next to it
- [ ] CI installs all three browsers and runs every story in each, on every pull request
- [x] Any engine difference that needs a tolerance or a skip is recorded here with a measurement, not hidden in a config
- [ ] CI wall time before and after is recorded here; if it doubles, Firefox and WebKit move to pushes to main and this item says so

## 2026-10-03

Criterion 1 reworded with the CTO: the ticket assumed forced colours was Chromium-only. Measured under Playwright's forcedColors: 'active': Firefox really forces colours (author rgb(255,0,0) on rgb(0,255,0) computes to rgb(0,0,0) on rgb(255,255,255), background-image none); WebKit matches the media query but keeps the author's colours and gradient, as Safari has no forced colours mode. So forced colours runs in Chromium and Firefox (project forced-colors-firefox) and not WebKit, with that measurement beside the config.

## 2026-10-03

Projects: storybook, p3, forced-colors and zoom stay Chromium; firefox and webkit run every story but those tagged print (Playwright prints to PDF only in Headless Chromium: an engine capability, so a tag) and the Chromium-only tags. p3 stays Chromium because only Chromium takes --force-color-profile; zoom stays Chromium to keep the run short, as continuity at one device pixel already runs in all three. Firefox and WebKit walk every density in the story's own mode with pixels in each (4 screenshots) and axe once. ENGINES selects engines; CI runs Chromium in the check job (ENGINES=chromium) and Firefox and WebKit in a parallel engines job.

## 2026-10-03

Engine differences, each a known failure in .storybook/known.ts (printed every run, stale fails the run), not a tolerance: (1) firefox-columns: forty one-cell runs vs one run of forty end apart in Firefox: 15.3px -0.083px, 16px 0, 16.4px +0.317px, 17px -0.050px (Chromium and WebKit exactly 0). Firefox lays text out in 1/60px and the cell is rounded to 1/64px. (2) firefox-forced-corners: under forced colours in Firefox, the east stroke of the top-left corner (┌, ╔ at 0,0) stops short of the cell edge. (3) firefox-forced-highlight: Firefox's emulated palette pairs HighlightText #ffffff with Highlight #3399ff, 2.94:1, and the solid button draws in that pair. To let play-function assertions meet the table, axe now runs inside the walk (the addon's own run is off) and stories wrap an engine-specific assertion in expectKnown(id, ...).
