---
'@rockaway/tokens': minor
---

Check every declared foreground/background pair in both modes (`pnpm contrast`, and in the tests across 55 themes), with APCA reported next to WCAG 2. Export `checkContrast`, `pairs`, `apca` and a small DTCG resolver (`resolveTree`, `resolveValue`). Palette step 8 is darker in light mode and lighter in dark, so control borders reach 3:1 on a tone-elevation page as well.
