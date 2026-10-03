---
id: 29
uid: 6be9a6a6-0e91-4548-b377-0bc3c57db120
title: Set container-query conventions for component sizing
type: feature
status: done
milestone: runtime
assignee: Oddur Sigurdsson
depends_on:
- 24
created: 2026-09-22
updated: 2026-09-22
priority: p2
layer: css
effort: s
---

## Problem

## Proposal

## Acceptance criteria

- [x] One named container (`rk`), opted into with a single utility class
- [x] Component CSS asks the container, never the viewport
- [x] The width steps are written down, with the reason they are literals
- [x] Proven in a browser: the same component differs by the space it is in, at one window size
