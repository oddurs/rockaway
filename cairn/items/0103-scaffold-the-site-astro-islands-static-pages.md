---
id: e1a6b9f8-1076-4387-81b4-1ecaf9350082
title: 'Scaffold the site: Astro, islands, static, Pages'
type: chore
status: backlog
milestone: site
depends_on:
- 8a07961a-1c71-42d4-b758-905ad6181c48
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tooling
effort: m
---

## Acceptance criteria

- [ ] `apps/site`, Astro with React islands, output static
- [ ] Frames render at build time, because the engine is pure: the first paint needs no JavaScript
- [ ] Deployed to GitHub Pages by CI on every push to main, with a preview build on pull requests
- [ ] The site imports the published packages the way a consumer would, not by reaching into src
