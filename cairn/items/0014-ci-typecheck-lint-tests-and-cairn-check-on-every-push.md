---
id: 14
title: 'CI: typecheck, lint, tests and cairn check on every push'
type: chore
status: done
milestone: foundations
assignee: Oddur Sigurdsson
depends_on:
- 12
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: tooling
effort: s
---

## Acceptance criteria

- [x] Typecheck, lint and Vitest run in CI
- [x] `cairn check` and `cairn render --check` fail the build when out of date

## 2026-09-22

Green on the first run: https://github.com/oddurs/rockaway/actions/runs/35687186724
