---
id: 326
uid: 31559738-2472-472c-a52c-4343cf303431
title: Prefetch Tree rows that are links
type: feature
status: ready
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p3
layer: components
effort: m
---

## Purpose

Tree href rows have no React Aria render prop, so they navigate through RouterProvider and cannot prefetch: a prefetch callback, or a TreeItem render prop upstream.
