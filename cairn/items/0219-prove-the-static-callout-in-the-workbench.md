---
id: 219
uid: 390e5000-588a-446e-b47b-606e7af5a4dc
title: Prove the static callout in the workbench
type: chore
status: backlog
milestone: site
depends_on:
- 140
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

`.rk-callout-static` (the site's Markdown callout) is only exercised by the
site's browser test, which runs no axe and no forced colours.

## Acceptance criteria

- [ ] A workbench story fed by the pipeline's output, so it gets axe, forced colours and the density × mode matrix
