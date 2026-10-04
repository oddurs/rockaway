---
id: 227
uid: 612af759-5f0d-44d0-abd7-6f7c48a115bf
title: Render painted cells through one shared component
type: chore
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 126
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## Problem

Switch renders its track as `rowRuns` in JSX, Tree its guides the same way, List
its scrollbar after mount, and Screen its chrome through 0126. One `<Cells
buffer painter>` in `paint/` would give all of them one renderer.

## Acceptance criteria

- [ ] A shared component renders a buffer's runs, server and client alike, and Switch, Tree, List and Screen use it

## 2026-10-03

Cells, in paint/render.tsx, replaces Chrome and chromeRows (unreleased): a block of rows, or one row inline; colours={false} where the stylesheet colours cells by state (Tree's guides); stretch for 0238's elastic first paint. Screen, List and Tree render through it. Switch is not on main yet (feat/switch); it takes Cells there, and the criterion is ticked when it does.
