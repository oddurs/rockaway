---
id: 186
uid: fc2905f8-db0e-4d0c-9279-7eb3e85be3bc
title: Make the full workbench run hold up under load
type: chore
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

With several branches building at once, the screenshot-based stories
(Continuity `Dense` in particular) hit the 15s test timeout in every browser
project, while passing alone in 1.5s. Reported by three engineers; it makes a
local `pnpm run check` unreliable exactly when the team is busiest.

## Acceptance criteria

- [ ] Screenshot-heavy stories have a timeout sized to their work, or the browser projects run one after another locally
- [ ] A full local run passes three times in a row with two other full runs going
