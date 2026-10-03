---
id: 103
uid: e1a6b9f8-1076-4387-81b4-1ecaf9350082
title: 'Scaffold the site: Astro, islands, static, Pages'
type: chore
status: backlog
milestone: site
depends_on:
- 77
- 121
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: tooling
effort: m
---

## Acceptance criteria

- [ ] `apps/site`, Astro with React islands, output static
- [ ] The site imports the published packages the way a consumer would: no `@rockaway/source` condition, no path into `src`
- [ ] `pnpm check` builds the site, and pull requests upload the built site as a workflow artifact (deploying is 0146)
- [ ] One monospace font, self-hosted, subset, preloaded, with a metric-matched fallback so `1ch` does not change when it loads; box drawing does not need the font (0116)
- [ ] The base path is configurable, so the site works at `/rockaway/` or at a domain root
- [ ] A first page renders a Frame, to prove the pipeline end to end

Rendering frames at build time is 0126's job, and the budget (0109) asserts
it; the scaffold does not wait for either.

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
