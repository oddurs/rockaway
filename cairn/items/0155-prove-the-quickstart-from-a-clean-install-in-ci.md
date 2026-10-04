---
id: 155
uid: 19764033-8dfc-42da-9034-253cc7cb73f5
title: Prove the quickstart from a clean install in CI
type: chore
status: doing
milestone: v0.1
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 107
- 121
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: tooling
effort: m
---

## Problem

The getting-started guide (0107) promises a screen in under twenty lines. The
packages have only ever been resolved inside the workspace, through source
conditions. The first time the guide meets a clean install should not be the
first time a stranger tries it.

## Acceptance criteria

- [ ] A CI job packs the four packages, creates a new Vite + React app outside the workspace, installs the tarballs, and pastes in the guide's code verbatim (extracted from the guide's source, not copied by hand)
- [ ] The app builds, and a headless browser asserts the screen's text snapshot
- [ ] The same with Next.js app router, importing from a server component
- [ ] The job runs on every pull request that touches `packages/` or the guide

## 2026-10-03

Claimed past 0107: the guide and its quickstart fences are on main (#113); 0107 stays open only for its link to the component recipe, which 0155 does not need.
