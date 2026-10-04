---
id: 46
uid: 6456c8a0-12f1-448d-afb5-f584b3bf10d4
title: Serve compositions from a copy-in registry
type: feature
status: review
milestone: v0.1
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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
- [x] Every item imports only from the packages, never from another item, checked by a test
- [ ] `npx shadcn add <site>/r/<item>.json` into a clean Vite app produces a working screen, in the quickstart job (0155)
- [x] The site has a page listing the registry items, each with its snapshot

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

The registry is served from the site: src/registry/<name>/ holds each item's source, src/registry/items.ts what a person says about it, and src/lib/registry.ts generates /r/<name>.json (shadcn registry-item, type registry:block) and /r/registry.json from the source. Dependencies are read from the imports. The rule from 0011 (packages, React and the item's own files only, never another item) is enforced at build and in test/registry.test.ts. /registry/ draws each item, hydrated, with its install line. Seeded with three compositions built from what has merged: empty-state, confirm-panel, file-browser. Each component is imported from its own entry, so a copier ships only what it uses. Criterion 1 waits on 0151 (the example apps) and on the field components for the Form patterns. Criterion 3 runs locally as `pnpm build && pnpm --filter site quickstart registry`, which shadcn-adds every item into a clean Vite app, builds it, and checks that each screen reads back as the registry page draws it. It ticks once 0155 runs the quickstart in CI. Until 0045 publishes, the served JSON points @rockaway/react at the packed tarball. Found along the way: (a) shadcn's CLI treats every string literal as classes and trims it, so {' '} arrives as {''}; the rule refuses whitespace-only strings. (b) Frame content is white-space: pre, so copy in a frame is broken into lines by hand. (c) Callout is for prose and draws no frame inside a Frame. (d) KeyHint renders a VisuallyHidden div, so it cannot sit in a <p>. (e) The quickstart's module server now also rewrites @rockaway/tokens, which @rockaway/react/testing imports; vite still passes.
