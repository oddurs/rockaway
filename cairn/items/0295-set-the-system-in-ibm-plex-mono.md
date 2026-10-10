---
id: 295
uid: ed5b1a29-17dc-4cbc-99b5-be7a67cdd557
title: Set the system in IBM Plex Mono
type: decision
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: tokens
effort: s
---

## Purpose

One monospace used like a typeface: hierarchy from size in whole rows, weight, italic, case and tracking, never a second family. IBM Plex Mono replaces JetBrains Mono for its warmth, true italic and small-size clarity. Approved by the owner.

## 2026-10-10

Fixed in #225: text-rendering geometricPrecision on every element (Chromium on Linux rounds every advance to a whole pixel otherwise), and measureCell takes the difference of two probes. Sunset flipped to ibm-plex in #221.
