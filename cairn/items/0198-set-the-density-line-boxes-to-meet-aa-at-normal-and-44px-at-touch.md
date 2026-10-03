---
id: 198
uid: f6f77df6-f55b-4389-bdf1-2f51db83831a
title: Set the density line boxes to meet AA at normal and 44px at touch
type: bug
status: backlog
milestone: primitives
depends_on:
- 197
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: tokens
effort: s
---

## What happens

`normal` gives a 20px row and `touch` a 32px one. 0197 says they must be 24px
and 44px.

## Acceptance criteria

- [ ] `normal` is 1.5, `touch` 2.75 and `airy` sits between them; `dense` stays 1
- [ ] Every interactive row meets 24px at `normal` and 44px at `touch` in the target check (0125), with the known-failures entries for them removed
- [ ] `dense` is a permanent known-failures entry citing 0197, and `docs/concept.md` and the README say what each density is for
- [ ] The README's touch claim is true, and every story and snapshot that depended on the old line boxes is updated
