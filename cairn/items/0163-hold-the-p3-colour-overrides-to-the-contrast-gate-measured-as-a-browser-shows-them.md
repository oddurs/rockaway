---
id: 163
uid: 91fa6325-6a6e-4dad-acd1-99affa0ea159
title: Hold the p3 colour overrides to the contrast gate, measured as a browser shows them
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-10
closed_at: 2026-10-10
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

- [x] The gate measures every p3 override, mapped to what a browser will display, in both modes
- [x] Every declared pair passes 4.5:1 (or 3:1 for non-text) in sRGB and in p3, with the margin reported
- [x] Badge's stories pass axe on a p3 display
- [x] 0052's theme contexts go through the same gate

## 2026-10-03

Measured as a browser shows it: each colour is gamut-mapped with CSS Color 4's algorithm (what Terrazzo writes for each of srgb, p3 and rec2020, verified slot for slot against tokens.css by test/gamut.test.ts) and rounded to four figures as it is serialised. Five views: srgb; p3 and rec2020 as the screen lights them (luminance from XYZ, no clipping); and 'p3 as sRGB' / 'rec2020 as sRGB', the override clipped per channel, which is how Chromium hands it to axe (oklch(52% 0.16 150) -> #008130, as found). contrast() is the worst of the five; the gate reports the view and the margin.

## 2026-10-03

Surprise: the old gate was wrong on sRGB screens too. It mapped by bisecting chroma, but the stylesheet holds CSS Color 4's mapping (which clips at the end, shifting hue a little): light cyan on bg.page measured 4.5 in the gate and 4.42 in the browser. Switching toSrgbGamut to the CSS 4 algorithm also moves toHex, so the terminal theme files change by a step in places.

## 2026-10-03

The generator corrects with fitContrast: a slot failing a declared pair moves away from the background in lightness, hue and chroma kept, until it passes in every view; the moves are printed by pnpm generate and written into the ansi group's description. For the default theme that is light cyan #007b81 -> #007279 and light green #008130 -> #007f2f. The workbench now runs every story on a forced sRGB screen and again on a forced p3 one (--force-color-profile), so axe checks p3 everywhere, and a Mac and a Linux runner see the same thing.

## 2026-10-10

The p3 project runs every story, Badge's among them, with axe on a forced p3 screen, and passes in CI.
