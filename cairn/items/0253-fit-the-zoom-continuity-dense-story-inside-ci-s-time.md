---
id: 253
uid: 29d16375-3d8e-41f6-a7ca-64e87357e559
title: Fit the zoom Continuity Dense story inside CI's time
type: chore
status: done
milestone: v0.1
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: tooling
effort: s
---

## Purpose

The zoom project's Continuity "Dense" story times out or flakes in CI (#147, #158), failing branches that never touch it. Split it or cut its instances as #148 did for List, and prove the timing.

## 2026-10-03

Done in #165 (merged as aba4431): each density story is one story a painter, nine screens each, same assertions halved. On CI's zoom browser Dense went from 31.2s (timeout) to 14.8s and 8.9s, Normal from 19.9s to 9.1s and 8.5s.
