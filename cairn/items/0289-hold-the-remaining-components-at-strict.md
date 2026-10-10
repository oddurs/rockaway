---
id: 289
uid: 1c9b3dac-edf4-477c-b883-f351c22f7eeb
title: Hold the remaining components at strict
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p2
layer: tooling
effort: m
---

## Purpose

Divider, Fieldset, KeyHint, Keymap, Link and the overlays have no passing strict story, so their metadata says standard. A strict story each raises them, or shows what stops them.

## 2026-10-09

A story pinned at strict for Divider, Fieldset, KeyHint, Keymap, Link and the overlays (a popover and a dialog), each reusing its file's own page; the check after the story is the test. All pass, so nothing stopped them and there are no findings for owners: no story had asked before. The metadata reads the level from the stories (0167), so every component now holds strict; the only parts at standard are Description and FieldFrame, parts of components that hold strict. Divider's story keeps dividers on their own, as rendering asked: its dense leak in Between panes is a descender in the paragraph above the rule (#222).
