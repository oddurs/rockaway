---
id: 155
uid: 19764033-8dfc-42da-9034-253cc7cb73f5
title: Prove the quickstart from a clean install in CI
type: chore
status: done
milestone: v0.1
assignee: Oddur Sigurdsson
depends_on:
- 107
- 121
created: 2026-10-03
updated: 2026-10-04
closed_at: 2026-10-03
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

- [x] A CI job packs the four packages, creates a new Vite + React app outside the workspace, installs the tarballs, and pastes in the guide's code verbatim (extracted from the guide's source, not copied by hand)
- [x] The app builds, and a headless browser asserts the screen's text snapshot
- [x] The same with Next.js app router, importing from a server component
- [x] The job runs on every pull request that touches `packages/` or the guide

## 2026-10-03

Claimed past 0107: the guide and its quickstart fences are on main (#113); 0107 stays open only for its link to the component recipe, which 0155 does not need.

## 2026-10-03

Locally, from a clean temporary directory: Vite (create-vite 9.2.1, react-ts) builds and its screen matches the guide's in 18s; Next.js (create-next-app 16.3.8, app router, the page a server component importing Frame and Button) in 60s, both with a warm npm cache. The script on main failed before it reached the screen: the testing entry it loads into the page now imports @rockaway/tokens as well as @rockaway/grid, and its little server rewrote only grid's bare import; it now rewrites any of the four packages'. The job is a workflow of its own, a matrix of vite and next, so the two run side by side and beside CI, and only on pushes and pull requests that touch packages/, the guide, the script or the workflow.

## 2026-10-03

First CI run (37171779282): Quickstart in vite 59s and Quickstart in next 1m23s, as parallel jobs beside CI, which takes about five minutes, so the PR's wall clock does not grow. Both builds pass and both screens match the guide.

## Result

A Quickstart workflow packs the four packages, scaffolds Vite and Next.js apps outside the workspace, writes in the guide's code from its fences, builds them and reads the screen back; parallel jobs, on changes to packages/, the guide, the script or the workflow

## 2026-10-04

Merged main after #154 (0046): the registry's quickstart changes to the script had already made the same bare-import fix (for the engine and the tokens), so main's script stands. The registry proof joins the matrix as a third job (registry), which builds the site first because the proof serves its r/registry.json; it adds shadcn's CLI to a fresh Vite app and compares every item with the registry page. Locally 19s. The workflow also triggers on apps/site/src/registry/**.
