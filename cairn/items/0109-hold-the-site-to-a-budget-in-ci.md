---
id: 04d9e239-c50a-4ce1-873b-db2273abb664
title: Hold the site to a budget in CI
type: chore
status: backlog
milestone: site
depends_on:
- 90f33af7-3d4e-48d1-a5e6-c01cce59ecdc
- e1a6b9f8-1076-4387-81b4-1ecaf9350082
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: tooling
effort: m
---

## Acceptance criteria

- [ ] Under 100 kB of JavaScript on the first page, enforced, with the number printed on every run
- [ ] The first paint renders without JavaScript at all, asserted with scripts disabled
- [ ] axe clean on every built page, in light and dark, at touch density
- [ ] Grid conformance runs against the built pages, not only the workbench
