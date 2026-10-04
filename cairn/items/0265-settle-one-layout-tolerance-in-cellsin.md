---
id: 265
uid: c7acf721-9e9e-4173-8020-217d377acddb
title: Settle one layout tolerance in cellsIn
type: chore
status: ready
milestone: primitives
created: 2026-10-04
updated: 2026-10-04
priority: p2
layer: grid
effort: m
---

## Purpose

Select's trigger, Popover, Button and the overlay sheet each came out a hair over N cells, and each patched it locally (1/32px here, an explicit width there). Error grows with runs laid out in a row; set one principled tolerance in cellsIn and route the overlay's rounding through it.
