---
'@rockaway/tokens': minor
---

`border.default` is now a boundary you can see: at least 3:1 against `bg.page`, `bg.surface` and `bg.subtle`, in both modes and every preset, and the contrast gate holds it there in every view. It was about 1.2:1, a web hairline colour, and on a character grid a frame is the only boundary a pane has (WCAG 1.4.11). `border.surface` reads the same slot, so it moves with it. `border.control` stays a step stronger than the ordinary edge, so it moves too.

`border.subtle` is unchanged, and its description now says what it is for: decorative separation inside something that is already bounded. It is never the only edge of anything.
