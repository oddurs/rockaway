---
id: 323
uid: 0d1b4358-62bd-4c65-a1ce-177af7d37e41
title: Size type in half rows
type: feature
status: done
milestone: primitives
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p2
layer: components
effort: s
part_of:
- 311
---

## Purpose

Row-sized type (0296) takes half steps, 1.5 and 2.5 rows, padded to whole cells. Part of decision 0311.

## 2026-10-10

Landed in #262: Text takes sizes 1.5 and 2.5, its run padded to whole rows (round up to the next row), and a block a seam; the stories hold it in Chromium, Firefox and WebKit.
