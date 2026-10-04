---
id: 227
uid: 612af759-5f0d-44d0-abd7-6f7c48a115bf
title: Render painted cells through one shared component
type: chore
status: backlog
milestone: primitives
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
