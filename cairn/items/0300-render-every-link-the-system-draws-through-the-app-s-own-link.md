---
id: 300
uid: 6f1ce3e0-b3eb-4a06-a5bf-671ec6829d77
title: Render every link the system draws through the app's own link
type: feature
status: ready
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p1
layer: components
effort: m
---

## Purpose

LinkTree, Link and KeyHint targets render through a supplied link component (React Aria's RouterProvider or a small context): a real a href without script, the framework's Link with it, so Next prefetches.
