---
id: 109
uid: 04d9e239-c50a-4ce1-873b-db2273abb664
title: Hold the site to a budget in CI
type: chore
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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
- [x] The first paint renders without JavaScript at all, asserted with scripts disabled
- [ ] axe clean on every built page, in light and dark, at touch density
- [x] Grid conformance runs against the built pages, not only the workbench

## 2026-10-03

Program plan: also asserts zero layout shift on the landing page through first load, including the font swap, measured with a PerformanceObserver in Playwright; and runs 0117's continuity check alongside conformance on the built pages.

## 2026-10-03

A budget suite of its own (apps/site/budget, pnpm --filter site budget) runs as the Site budget CI job beside the others. It builds the site at /, serves it with the packages' builds under /__rk/ so a page can load @rockaway/react/testing, and reads all 11 built pages in Chromium. First run, locally: the first page ships 458.5 kB of JavaScript (143.7 kB gzipped), 391.7 kB of it React DOM's client for the landing page's island; axe at touch finds no h1 on the landing page and an empty table header on the concept page (docs/concept.md); every page conforms (one screen on the site, the landing page's) and 1468 shaped cells meet; no layout shift through first load, the font swap included. The three failures are known failures declared in the suite, printed every run with reasons and proposed tickets, and failing it once they stop failing. Criteria 1 and 3 stay open until those land.
