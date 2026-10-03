---
id: 199
uid: b5ea7301-44a8-471f-8b8e-ba9fd0171419
title: Remeasure a screen when its context changes
type: bug
status: backlog
milestone: primitives
depends_on:
- 126
created: 2026-10-03
updated: 2026-10-03
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

- [ ] `Screen` also observes a hidden `1ch × 1lh` probe and remeasures when it changes
- [ ] A story switches density, mode and font under a fixed-size screen and checks its cell each time
- [ ] The `screen-remeasure` known-failures entry is removed

## 2026-10-03

Raised to p0: the owner meets it in Storybook when switching density on List stories ('off the grid').
