---
id: 212
uid: e11fa868-123f-4253-821f-6a421dd480c3
title: Round the cell to the engine's layout unit
type: bug
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 83
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: grid
effort: s
---

## What happens

Firefox lays text out in 1/60px and the cell is rounded to 1/64px (Chromium's
unit), so forty one-cell runs and one forty-cell run end up to 0.317px apart at
16.4px. Chromium and WebKit are exact. Known entry `firefox-columns` (0124).

## Acceptance criteria

- [x] The cell is rounded to the layout unit of the engine drawing it, and "A column is a column" passes in Firefox
- [ ] The `firefox-columns` entry is removed

## 2026-10-03

Fix: screen.css rounds each run's edges to --rk-layout-unit, 1/64px by default and 1/60px under @supports (-moz-orient: inline), which only Gecko matches. Proved with a local Firefox run (an untracked copy of vitest.config.ts with the Playwright instance set to firefox, RK_ENGINE=firefox, --project storybook, Continuity.stories.tsx -t 'column is a column'): failed on main (15.3px: 368.583 vs 368.667), passes with the change. WebKit and Chromium runs of Continuity/Screen/Frame are unchanged from main (WebKit's Prints and three Screen failures exist on main too). The firefox-columns entry lives only on the unmerged test/three-engines branch, so criterion 2 waits on that branch: it should drop the entry when it lands after this.
