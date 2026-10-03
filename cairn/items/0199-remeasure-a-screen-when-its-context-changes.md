---
id: 199
uid: b5ea7301-44a8-471f-8b8e-ba9fd0171419
title: Remeasure a screen when its context changes
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 126
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: components
effort: s
---

## What happens

`Screen` remeasures only when its own box resizes. A screen given `cols`/`rows`
sizes that box from the last cell it measured, so a density change, a mode
change or a late web font never resizes it: it keeps a 20px cell inside a 24px
line box. Found by the density matrix (0125); it also happens in the Storybook
toolbar.

## Acceptance criteria

- [x] `Screen` also observes a hidden `1ch × 1lh` probe and remeasures when it changes
- [x] A story switches density, mode and font under a fixed-size screen and checks its cell each time
- [x] The `screen-remeasure` known-failures entry is removed

## 2026-10-03

Raised to p0: the owner meets it in Storybook when switching density on List stories ('off the grid').

## 2026-10-03

Screen's ResizeObserver also observes a hidden span, 1ch by 1lh, absolute at the origin and visibility hidden, so a change of density, mode or font resizes the probe when it cannot resize a cell-sized box. Re-applied on #88's screen.tsx. Grid/Remeasure 'Follows its context' switches density, mode and root font size on the root, as the toolbar does, under a 12 x 4 screen and checks the cell against the line box and the font's advance and the box against cell x rows. It fails without the probe (24px cell in a 16px line box at dense) and passes with it. Watch: a first version polled with waitFor, and the polling itself nudged the screen into measuring, so it passed without the fix; the story waits ten frames and asserts once, as the matrix does.

## 2026-10-03

With screen-remeasure gone, the matrix reads cell-sized screens at every density for the first time. Across List and Frame the one new failure is List's Disabled story at dense, rows at y = 15, 31 and 47px in 16px cells after keyboard navigation: known entry list-dense-offset, ticket 0211.

## Result

Screen observes a 1ch x 1lh probe and remeasures on any context change; screen-remeasure is gone and list-dense-offset (0211) is the one defect it uncovered

## 2026-10-03

CI's first full run with the probe found what stale screens had hidden: (1) at touch, a 22-row frame is 968px and the Storybook plugin sets every story's frame to 1200 x 900, so its screenshot was cut off and the bottom rows read as gaps; the capture now grows the frame to hold the element, inside a page made 1600 x 2400 so Vitest does not scale it. (2) A link standing alone in a frame is an 18px inline box at touch, not the 44px line box: known entry standalone-link-touch, ticket proposed. (3) Frame's variant stories passed 30s on CI with every screen read at every density: testTimeout is 60s. Locally on macOS only, Fieldset's Painters story leaks ink above its top-left corner at dense; Linux CI does not see it, so it is reported rather than declared (an entry would be stale on CI).
