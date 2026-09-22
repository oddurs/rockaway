---
id: 17
title: Write DTCG sources for colour, space, size, radius, type, motion and elevation
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
depends_on:
- 16
- 19
- 62
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: l
---

## Acceptance criteria

- [x] Every category exists as DTCG 2025.10 JSON, and validates
- [x] Reference tier holds raw values only; nothing references upward
- [x] Type scale and spacing are generated from ratios, not listed by hand
- [x] Every value on the concept canvas's Default board is reproduced, or the difference is recorded with its reason

## 2026-09-22

Scope narrowed: these sources are written by the theme generator (#0062), not by hand. This item is now about reviewing the generated output per category and deciding what stays hand-authored (motion, if anything).
## Canvas comparison (2026-09-22)

The concept canvas's Default board against the generated default theme. Colours
are OKLCH lightness unless noted.

| Role | Canvas light / dark | Generated light / dark | |
| --- | --- | --- | --- |
| `bg.page` | 0.978 / 0.165 | 0.978 / 0.165 | same |
| `bg.surface` | 1.0 / 0.205 | 1.0 / 0.205 | same |
| `bg.subtle` | 0.958 / 0.245 | 0.956 / 0.245 | same within rounding |
| `bg.hover` | 0.94 / 0.27 | 0.935 / 0.27 | same within rounding |
| card border (`border.surface`) | 0.905 / 0.31 | 0.905 / 0.31 | same |
| input border (`border.control`) | 0.80 / 0.42 | **0.645 / 0.52** | **changed**: the canvas value was about 1.8:1 against the page, failing WCAG 1.4.11. Now at least 3:1 (0018) |
| `fg.muted` | 0.47 / 0.74 | 0.48 / 0.76 | same within rounding; still at least 4.5:1 |
| `fg.default` | 0.20 / 0.965 | 0.21 / 0.965 | same within rounding |
| `bg.accent.solid` | 0.52 C 0.17 / 0.74 C 0.15 | same | same |
| `bg.accent.subtle` | 0.955 C 0.03 / 0.30 C 0.06 | 0.955 C 0.03 / **0.27 C 0.05** | dark one step darker, so step 3 stays an element background under `fg.accent` at 4.5:1 |
| `fg.accent` | 0.45 / 0.84 | 0.45 / 0.84 | same |
| `fg.on-accent` | white / 0.20 C 0.04 | same | same |
| space unit, control heights | 4px × 0.75 / 1 / 1.25; 32 / 38 / 44 | 3 / 4 / 5px; 32 / 38 / 44 | same (units rounded to whole px) |
| radius (r = 6) | control 6, card 9, overlay 8, tag 5, box 4 | same | same |
| text | 72 display, 17 lead, 14 body, 13 small, 12 caption | 72, 17, 14, 13, 12 from 14 × 1.2ⁿ | same |
| card heading | 16px | **17px** (`heading-xs`) | nearest step on the 1.2 scale; the canvas value was hand-picked |
| shadows | surface 1/2 + 10/30, overlay 1/2 + 14/36, control 1/2 | same offsets, blurs and alphas | same |
| focus ring | 2px gap + 2px accent | `focus.width` 2, `focus.offset` 2, `border.focus` = accent 9 | same |

Everything else on the board (status tones, avatars, tags) reads these tokens.

## 2026-09-22

Superseded by 0022: `border.control` is now L 0.62 light / 0.54 dark, so it also clears 3:1 on a tone-elevation page.
