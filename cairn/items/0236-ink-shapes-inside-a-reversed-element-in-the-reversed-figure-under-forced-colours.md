---
id: 236
uid: 766bc3a3-40a8-4088-8c2d-c010b9ff0d9d
title: Ink shapes inside a reversed element in the reversed figure under forced colours
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: css
effort: m
---

## Purpose

Under forced colours a box or block drawn inside a reversed element took CanvasText and vanished on the reversed ground. A generic screen.css rule inks [data-rk-shape] with --rk-forced-ink, every reversal's opt-out sets it, and a pixel check covers every reversing component's shaped cells. Found by the metadata engineer after 0201; built in #159.

## 2026-10-03

Ink is Canvas, not currentColor: an unregistered custom property holding currentColor resolves at the shape cell against its own colour (CanvasText for a muted guide), not the reversed element's. A pressed fill reverses back, so it resets the ink to CanvasText. Of the reversing components on main only Tree (guides) and a painted reverse run hold shapes on the reversed ground; List's scrollbar is outside the row, Button's brackets are not shapes, Table's selected cells hold HTML. reverse-opt-out.test.ts fails an opt-out covering a reversal that sets no --rk-forced-ink, so Tabs is held to it when it lands. ReverseVideo checks every [data-rk-shape] on a reversed ground in pixels; without the rule a reverse-drawn box fails (0.04 of figure, needs over 0.06).
