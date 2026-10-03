---
id: 148
uid: 219ac8b7-3a12-4871-ba8a-73f12bac78e7
title: Switch theme, mode and density on the site, and remember the choice without a flash
type: feature
status: backlog
milestone: site
depends_on:
- 52
- 104
- 180
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: site
effort: m
---

## Problem

The landing page promises a theme switcher over the real palettes (0108), and
a TUI site should let its reader pick the cell they like. A switcher that
renders light for one frame and then dark, or `normal` and then `touch`, is the
first thing an HN reader on a phone will notice.

## Acceptance criteria

- [ ] Theme preset, mode (light, dark, system) and density (dense, normal, airy, touch, automatic) are switchable from the status bar and from the command palette
- [ ] The choice persists, and an inline script in the head applies it before first paint: no flash, asserted by a Playwright test that captures the first frame
- [ ] Switching theme or density changes no geometry beyond the cell's own size, and conformance passes in every combination
- [ ] With JavaScript disabled the page follows the system's mode and pointer, and the switcher is not shown
