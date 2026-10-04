---
id: 148
uid: 219ac8b7-3a12-4871-ba8a-73f12bac78e7
title: Switch theme, mode and density on the site, and remember the choice without a flash
type: feature
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-04
depends_on:
- 52
- 104
- 180
created: 2026-10-03
updated: 2026-10-04
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
- [x] The choice persists, and an inline script in the head applies it before first paint: no flash, asserted by a Playwright test that captures the first frame
- [ ] Switching theme or density changes no geometry beyond the cell's own size, and conformance passes in every combination
- [x] With JavaScript disabled the page follows the system's mode and pointer, and the switcher is not shown
- [x] The site (0106, 0148) lists every theme and offers each terminal format for download

## 2026-10-04

Built on feat/switcher, stacked on the landing page. The look is the three context attributes on html (data-rk-theme, data-theme, data-density; 0180 will rename them), kept in localStorage (rockaway:look). The pre-paint script in Document.astro (src/lib/look.ts) sets them and document.writes the chosen theme's stylesheet into the head, so it is parser-inserted and render-blocking in every engine. The site test reads the first frame (a requestAnimationFrame registered before load) and finds it equal to the final look, not the system's. t, Shift+T, m and d move through the 9 themes, the 3 modes and the 5 densities, and so do the status bar's buttons, each named 'Theme: ink' and the like. The message line says each change. The runtime redraws the shell's chrome with the theme's glyphs (phosphor draws double borders). Conformance, continuity and axe pass in a sample of four looks across themes, modes and densities; dense's one-row targets fail 2.5.8 as documented (0197), and the test asserts that they do. With no script the status bar is hidden, the page follows the system's colour scheme, and a coarse pointer gets 44px rows. Not done: the command palette half of criterion 1 (0149, not built), and conformance in every one of the 135 looks rather than a sample of four.

## 2026-10-04

Criterion 5 was done by 0106: the themes page lists every theme with its terminal files, which the site test checks (16 islands, 64 files).
