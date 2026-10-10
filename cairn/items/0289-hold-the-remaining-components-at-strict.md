---
id: 289
uid: 1c9b3dac-edf4-477c-b883-f351c22f7eeb
title: Hold the remaining components at strict
type: chore
status: done
milestone: primitives
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p2
layer: tooling
effort: m
---

## Purpose

Divider, Fieldset, KeyHint, Keymap, Link and the overlays have no passing strict story, so their metadata says standard. A strict story each raises them, or shows what stops them.

## 2026-10-10

Re-cut onto main after #204 landed (#218). The strict stories for Divider, Fieldset, KeyHint, Keymap, Link and the overlays pass, and those components read strict in the metadata. Components that landed after this item was written (Card, Tabs, StatusBar, Toolbar, Text and others) are not covered by it; they move to 0353.
