---
id: 22
title: Check contrast for every semantic fg/bg pair in CI
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
depends_on:
- 14
- 21
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: tokens
effort: s
---

## Acceptance criteria

- [x] Declared fg/bg pairs checked in both modes against WCAG 2.2 AA (APCA reported alongside)
- [x] A failing pair fails the build with the pair and the ratio

## 2026-09-22

The check found a real failure on its first run: with `tone` elevation the page is palette step 3, and step 8 had only been tuned against steps 1 and 2, so control borders fell to 2.9:1 (WCAG 1.4.11). Step 8 now clears 3:1 against steps 1, 2 and 3 for every hue and temperature: neutral L 0.62 / 0.54, coloured hues 0.60 / 0.56. The palette test now covers step 3 too. The report runs in CI on every push; the test suite checks 55 themes (6 hues × 3 temperatures × 3 elevations, plus the default) and fails with the pair and ratio.
