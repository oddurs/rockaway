---
id: 333
uid: 9ca78524-7621-4926-be21-7c63684a8d71
title: Render the roadmap on main only, not on every branch
type: decision
status: backlog
milestone: foundations
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: tooling
effort: s
---

## Context

ROADMAP.md is rendered from the items and committed on every branch that touches an item, and `cairn render --check` fails a branch whose roadmap is stale. With squash merges and a fast lane, two PRs that each rendered their own leave main stale (fixed by #250 and #253), and every merge to main marks open PRs conflicting on the roadmap alone. Rendering found this; so did the fast lane.

## Options

1. Render on main only. Branches don't commit ROADMAP.md. A job after every push to main renders it and opens or pushes a render PR, which the fast lane already does (`render-main.sh`). `cairn render --check` runs on main only.
2. Keep rendering on branches, and keep the fast lane's render PRs as the safety net.
3. Teach GitHub the cairn merge driver. It cannot: a merge driver is per-clone configuration.

## Decision

## Consequences
