---
id: 197
uid: 5aeb7c3e-e6f5-4bbb-be10-c33fa8fc1152
title: Meet WCAG 2.2 AA target size at the default density, and 44px at touch
type: decision
status: done
milestone: primitives
depends_on:
- 74
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: tokens
effort: s
---

## Context

QA's density matrix (0125) measured what the line box gives a one-row control:
at 16px, `dense` 16px, `normal` 20px, `airy` 24px, `touch` 32px. Two problems:

- 0074 promised that a one-row control reaches a 44px touch target at touch
  density. At a line box of 2 it is 32px. The decision was right and the token
  is wrong.
- WCAG 2.2 AA (2.5.8) asks for 24px targets, or spacing that gives them 24px.
  List rows touch each other, so at `dense` and `normal` they fail. Buttons pass
  at `dense` only because of the space around them.

## Options

- Keep the terminal-tight default and declare AA failures at `normal`.
- Make the default density meet AA, and keep the tight density as an opt-in.

## Decision

**The default density meets WCAG 2.2 AA.** `normal`'s line box becomes 1.5
(24px at 16px). `touch` becomes 2.75 (44px), as 0074 always meant. `airy`
sits between them. `dense` stays at 1: a deliberate opt-in that trades target
size for density, documented as failing 2.5.8 for adjacent targets and carried
as a permanent, printed entry in the known-failures table, never as a silent
pass.

## Consequences

The default loses a little of the tight terminal look; `dense` keeps it for
those who choose it. A system that sells accessibility as a feature does not
fail AA by default.

## Result

The default density meets WCAG 2.2 AA: normal is a 1.5 line box (24px), touch 2.75 (44px, as 0074 promised), airy 2, dense 1 as a documented opt-in carried as a permanent known entry. Built in 0198 (#112).
