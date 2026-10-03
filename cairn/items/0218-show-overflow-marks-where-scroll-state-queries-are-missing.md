---
id: 218
uid: f3c64835-8cb6-4037-891d-de6abb33cdec
title: Show overflow marks where scroll-state queries are missing
type: feature
status: backlog
milestone: site
depends_on:
- 208
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: css
effort: s
---

## Problem

The `‹ ›` overflow marks (0208) use scroll-state container queries, which only
Chromium has, so Safari and Firefox readers lose the "there is more" cue.

## Acceptance criteria

- [ ] A small script (or a scroll-driven-animation fallback) sets the same state, so the marks show in every engine
