---
id: 167
uid: 97b97d9b-c47f-49ba-acaa-01891fa3648a
title: Add size in cells and conformance level to component metadata
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 47
- 123
created: 2026-10-03
updated: 2026-10-04
closed_at: 2026-10-04
priority: p1
layer: docs
effort: s
---

## Problem

0147's component page shows a component's size in cells and the strictness level
it holds. The metadata (0047) has neither, because the levels did not exist yet.

## Acceptance criteria

- [x] Each component's metadata states its minimum and default size in cells, read from its buffer function rather than written by hand
- [x] It states the conformance level it holds, read from the conformance check (0123)
- [x] The schema and the JSON Schema both carry the fields

## 2026-10-04

Level: read from the stories, not written. The extractor parses every workbench story file, reads each story's (or its meta's) globals.conformance, skips one with parameters.conformance false, and credits the level to every rockaway component it renders (or the meta's component when the story renders nothing of its own). A component holds the strictest. Every story passes its check in CI, so the level is proven; extracted.ts goes stale, and the test fails, when a story changes. Strict today: Badge, Button, Callout, Checkbox, Frame, List, Table, Tree (several through the Real components strict story); the rest standard.

## 2026-10-04

Size: each .meta.ts draws size.min (no words, or the least room its chrome needs: Frame and Divider's 0238 smallest, Callout's heading box, an overlay's 2 by 2) and size.default (the default variant with typical words) with its own buffer functions, and the published grid.size measures them. Not the first snapshot, which often stacks every variant. The site's component twin and llms.txt gain an On the grid section; meta.json carries grid for the MCP server (0048). The JSON Schema has grid and cellSize, and the schema-types agreement test covers both.

## 2026-10-04

Correction to the list above: the extractor now follows JSX into a wrapper the story file defines (RealPage), so the levels are what the stories prove through it. Strict: Badge, Button, Callout, Checkbox, Form, Frame, List, Table, TextField, Tree. Standard: Divider, Fieldset, KeyHint, Keymap, Link, OverlayPopover. Raising one is a matter of a passing strict story that renders it.
