---
id: 249
uid: deff1646-ffb3-4fbc-b66e-de48e3000aae
title: Own a skip link in the system
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## Purpose

The site's skip-to-content link is site CSS. A system component (or Screen option) should provide one that is visible on focus, drawn on the grid and tested for keyboard and forced colours. Found by the site lead in 0104.

## 2026-10-03

SkipLink in @rockaway/react/skip-link: <SkipLink target="main">Skip to content</SkipLink>, a plain anchor (not React Aria) so the static markup <a class="rk-skip-link" href="#main"> is the same link with @rockaway/css alone. Shown by :focus, not :focus-visible, so focus a script moves there is seen. Hidden by clip-path inset(50%), so it stays in the tab order and the a11y tree, and targets.ts already skips it at rest. Positioned at the nearest positioned ancestor's top-left (a Screen's corner, through .rk-content). With script, activation also focuses the target, adding tabindex=-1 when it cannot take focus; the target's focus ring is the page's to decide. screenshot() does not honour clip-path, so it reads the link's words at rest; stories test visibility with elementFromPoint instead.
