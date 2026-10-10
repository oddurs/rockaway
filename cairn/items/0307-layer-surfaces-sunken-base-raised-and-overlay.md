---
id: 307
uid: ed30e429-7bc7-4911-8807-8ed3701e7f82
title: 'Layer surfaces: sunken, base, raised and overlay'
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: tokens
effort: m
---

## Purpose

Four background levels in every theme, small steps apart, so panels read as a UI system; the contrast gate checks every text role on every level; forced colours collapse them to Canvas. Owner request.

## 2026-10-10

Shipped in #236: bg.surface-sunken, -base, -raised, -overlay (--rk-bg-surface-*) in every theme; sunset writes its own (blues at dusk, sands at golden hour); the gate holds every text role on all four and only ever moves a level; forced colours collapse all four to Canvas. Existing resolved values are byte-identical (additions only).
