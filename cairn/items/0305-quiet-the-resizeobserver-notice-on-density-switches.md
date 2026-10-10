---
id: 305
uid: e7bcba90-f739-49fa-b395-78b020da7365
title: Quiet the ResizeObserver notice on density switches
type: bug
status: ready
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p3
layer: grid
effort: s
---

## Purpose

"ResizeObserver loop completed with undelivered notifications" appears once per density switch on pages of nested measured screens. Harmless, but find the loop.
