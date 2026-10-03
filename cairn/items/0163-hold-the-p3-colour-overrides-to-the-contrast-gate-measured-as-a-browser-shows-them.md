---
id: 163
uid: 91fa6325-6a6e-4dad-acd1-99affa0ea159
title: Hold the p3 colour overrides to the contrast gate, measured as a browser shows them
type: bug
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: tokens
effort: s
---

## What happens

`tokens.css` overrides palette slots inside `@media (color-gamut: p3)` with
colours outside sRGB, and the contrast gate (0022) checks only the sRGB values.
`--rk-ansi-green` becomes `oklch(52% 0.16 150)`; Chromium maps it to `#008130`,
and `fg.success` on `bg.success.subtle` measures 4.41:1 in light mode. Found by
axe on the Badge stories; a Mac's headless Chromium matches `color-gamut: p3`.

## What should happen

Every pair passes in every colour space a browser will render it in. The p3
overrides are measured after gamut mapping the way a browser does it, and the
generator adjusts whatever falls short.

## Acceptance criteria

- [ ] The gate measures every p3 override, mapped to what a browser will display, in both modes
- [ ] Every declared pair passes 4.5:1 (or 3:1 for non-text) in sRGB and in p3, with the margin reported
- [ ] Badge's stories pass axe on a p3 display
- [ ] 0052's theme contexts go through the same gate
