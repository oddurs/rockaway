---
id: 236
uid: 766bc3a3-40a8-4088-8c2d-c010b9ff0d9d
title: Ink shapes inside a reversed element in the reversed figure under forced colours
type: bug
status: ready
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: css
effort: m
---

## Purpose

Under forced colours a box or block drawn inside a reversed element took CanvasText and vanished on the reversed ground. A generic screen.css rule inks [data-rk-shape] with --rk-forced-ink, every reversal's opt-out sets it, and a pixel check covers every reversing component's shaped cells. Found by the metadata engineer after 0201; built in #159.
