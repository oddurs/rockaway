---
id: 251
uid: 621e61b5-84e2-4bb8-b909-24344e16811a
title: Give the classic-scrollbars project the shared test timeout
type: chore
status: ready
milestone: v0.1
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Purpose

The classic-scrollbars browser project sets no testTimeout, so it runs at Vitest's 15s default while every other project has 30s; List's Wheel story timed out there. Set the shared timeout in apps/workbench/vitest.config.ts. Found by polish-chrome in 0115.
