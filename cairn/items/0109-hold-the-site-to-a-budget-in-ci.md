---
id: 109
uid: 04d9e239-c50a-4ce1-873b-db2273abb664
title: Hold the site to a budget in CI
type: chore
status: backlog
milestone: site
depends_on:
- 88
- 103
- 126
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: tooling
effort: m
---

## Acceptance criteria

- [ ] Under 100 kB of JavaScript on the first page, enforced, with the number printed on every run
- [ ] The first paint renders without JavaScript at all, asserted with scripts disabled
- [ ] axe clean on every built page, in light and dark, at touch density
- [ ] Grid conformance runs against the built pages, not only the workbench

## 2026-10-03

Program plan: also asserts zero layout shift on the landing page through first load, including the font swap, measured with a PerformanceObserver in Playwright; and runs 0117's continuity check alongside conformance on the built pages.
