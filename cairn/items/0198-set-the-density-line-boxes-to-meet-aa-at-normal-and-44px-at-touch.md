---
id: 198
uid: f6f77df6-f55b-4389-bdf1-2f51db83831a
title: Set the density line boxes to meet AA at normal and 44px at touch
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 197
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: tokens
effort: s
---

## What happens

`normal` gives a 20px row and `touch` a 32px one. 0197 says they must be 24px
and 44px.

## Acceptance criteria

- [x] `normal` is 1.5, `touch` 2.75 and `airy` sits between them; `dense` stays 1
- [x] Every interactive row meets 24px at `normal` and 44px at `touch` in the target check (0125), with the known-failures entries for them removed
- [x] `dense` is a permanent known-failures entry citing 0197, and `docs/concept.md` and the README say what each density is for
- [x] The README's touch claim is true, and every story and snapshot that depended on the old line boxes is updated

## 2026-10-03

The line boxes follow 0197: dense 1, normal 1.5, airy 2 (32px, between 24 and 44), touch 2.75. cell.css's coarse-pointer fallback is now 2.75 too, and DEFAULT_CELL (the guess before measuring, and on a server) is 8.4 × 24 to match the new default. The touch-height and normal-one-row known-failure entries are gone, and nothing they excused fails any more. dense-one-row stays, now citing 0197 and marked permanent.

## 2026-10-03

Removing touch-height surfaced a bug in the target check, not in the form: checkTargets counted React Aria's native checkbox and radio inputs as 13px targets. Those inputs sit inside a clipped VisuallyHidden span; the label around them is what a pointer meets. isHidden now walks up the ancestors for clip-path inset(50%) or clip rect(0...), and the Matrix target story has a case for it.

## 2026-10-03

Updated for the new line boxes: the Matrix story's claimed cell (20px to 24px), concept.md's font-versus-cell table (normal 24, airy 32, touch 44) and a new 'What each density is for' table, the README's phone section (no more 'about 44px'), the targets.ts doc comment, and the generator test, which now checks 24 at normal and 44 at touch. The stories that compare densities only compare them against each other, and passed unchanged.

## Result

Line boxes are dense 1, normal 1.5, airy 2 and touch 2.75: at 16px a row is 16, 24, 32 and 44px. Normal meets WCAG 2.2 AA and touch meets 44px in the target check; dense is the permanent, documented known failure citing 0197. checkTargets no longer counts a visually hidden input as a target.
