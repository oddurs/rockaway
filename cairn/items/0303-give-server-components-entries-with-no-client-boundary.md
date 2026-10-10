---
id: 303
uid: ca85c874-8679-4ab8-bf57-a87df7045bb9
title: Give server components entries with no client boundary
type: feature
status: ready
milestone: v0.1
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: distribution
effort: m
---

## Purpose

Server-only pieces (LinkTree, buffers, rowRuns, glyph reads) importable from an entry without 'use client', so React Server Components can call them.
