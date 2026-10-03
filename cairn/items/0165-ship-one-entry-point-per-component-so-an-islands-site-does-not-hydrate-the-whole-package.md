---
id: 165
uid: 2ea17cdb-f8e5-416b-a8d2-4be065461065
title: Ship one entry point per component, so an islands site does not hydrate the whole package
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] `@rockaway/react/<component>` exists for every component, typed, listed in both exports maps, and checked by publint and attw
- [x] The site imports through them and drops its one-export island modules
- [x] The island payload for one `Frame` is measured before and after and recorded here

## 2026-10-03

Island payload for one Frame, measured on the built site: the Frame island module and its static imports, gzipped at level 9, less what the React renderer loads anyway (67 kB, shared by every island). Through @rockaway/react: 46.5 kB. Through a one-export island module (the old workaround): 8.6 kB. Through @rockaway/react/frame: 8.5 kB. All three were measured on the same commit, rebased onto #67. The site lead's 43 and 6 kB were taken before #64 and #67.

## 2026-10-03

Each component has src/entries/<name>.ts, and that file is the only list of its public names. The barrel line became export * from './entries/<name>.ts', so names live in one place, a component that adds a name edits only its own entry, and values exported for tests or metadata (buttonVariants, linkStyle) stay private. The built index.d.ts exports the same 62 names before and after.

## 2026-10-03

Kept automatic with no per-component edits to shared config. tsdown reads src/entries/ for its entry list. Both exports maps carry one pattern, ./* to dist/entries/*.js with its .d.ts, so package.json never changes per component and parallel branches cannot conflict there. Exact subpaths (./paint, ./testing, ./metadata) take precedence over the pattern. check-packages.ts expands every pattern over JavaScript into concrete subpaths for attw, which checks only the subpaths it is given, and fails a dist/components/<name>.js that has no entry. Deleting dist/entries/link.js makes it fail naming the file. barrels.test.ts fails when a component has no entry, an entry has no component, an entry re-exports from anywhere but its own component, or the barrel reaches into ./components/ directly.

## Result

@rockaway/react/<component> for every component, from src/entries/<name>.ts through a ./* pattern in both exports maps, checked by attw per subpath. The site hydrates Frame from @rockaway/react/frame: 8.5 kB gzipped, against 46.5 kB through the index.
