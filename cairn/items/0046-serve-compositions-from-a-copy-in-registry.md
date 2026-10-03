---
id: 46
uid: 6456c8a0-12f1-448d-afb5-f584b3bf10d4
title: Serve compositions from a copy-in registry
type: feature
status: backlog
milestone: v0.1
depends_on:
- 103
- 151
- 155
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: distribution
effort: m
---

## Problem

0011 decided compositions ship through a copy-in registry in shadcn's format,
because they are code a team is expected to change. Nothing serves one.

## Acceptance criteria

- [ ] The example apps (0151) and the Form patterns are registry items in shadcn's format, served statically from the site at `/r/<name>.json`, with an index
- [ ] Every item imports only from the packages, never from another item, checked by a test
- [ ] `npx shadcn add <site>/r/<item>.json` into a clean Vite app produces a working screen, in the quickstart job (0155)
- [ ] The site has a page listing the registry items, each with its snapshot

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
