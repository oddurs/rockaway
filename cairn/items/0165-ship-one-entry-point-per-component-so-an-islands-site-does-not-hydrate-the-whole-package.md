---
id: 165
uid: 2ea17cdb-f8e5-416b-a8d2-4be065461065
title: Ship one entry point per component, so an islands site does not hydrate the whole package
type: feature
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: distribution
effort: m
---

## Problem

Astro (and any islands framework) treats an island's module as an entry and
keeps all its exports. Hydrating `Frame` from `@rockaway/react` shipped 43 kB
gzipped, React Aria's ListBox included; through a one-export module it is 6 kB.
Found by the site lead (0103). A consumer should not need that trick.

## Acceptance criteria

- [ ] `@rockaway/react/<component>` exists for every component, typed, listed in both exports maps, and checked by publint and attw
- [ ] The site imports through them and drops its one-export island modules
- [ ] The island payload for one `Frame` is measured before and after and recorded here
