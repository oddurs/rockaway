---
id: 242
uid: 3559e64c-ecd1-4615-b74c-fea801a432d2
title: Hold overlay surfaces to their anchor's grid in checkConformance
type: feature
status: ready
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: m
---

## Purpose

checkConformance measures each screen from its own origin, so an overlay that lands off its trigger's grid still passes. Record each surface's anchor screen and check the surface's offset in that screen's cells; then drop Popover's per-story offset asserts. Found by the overlays engineer in 0034.
