---
id: 329
uid: ba56e4cf-3064-41de-ae50-ed04adc15661
title: Steady the flaky List and site foundations tests
type: chore
status: backlog
milestone: foundations
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: tooling
effort: s
---

## What happens

Two tests failed on reruns of #233, unrelated to its change:
- classic-scrollbars: "List: A thousand rows";
- the site test "draws the foundations… (0106)".

## What should happen

Each passes reliably, or is fixed at its cause. Neither is retried or given a longer timeout without the cause being known.

## Acceptance criteria

- [ ] Each failure's cause is named in a note.
- [ ] Each passes 20 runs in a row in CI.
