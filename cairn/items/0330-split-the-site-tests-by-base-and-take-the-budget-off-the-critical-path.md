---
id: 330
uid: 72945355-7ae1-4bc0-a947-911c6623a4f3
title: Split the site tests by base, and take the budget off the critical path
type: chore
status: backlog
milestone: foundations
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: tooling
effort: s
---

## Purpose

With the CI shards from #232, a run is bounded by Site budget (about 2.5 minutes, not required) and Site tests (about 95 seconds). Split the site tests by base (`/rockaway/` and `/`), and see whether the budget job can share the site build instead of building again.

## Acceptance criteria

- [ ] A green run's wall time is under two minutes.
- [ ] No required check is lost.
