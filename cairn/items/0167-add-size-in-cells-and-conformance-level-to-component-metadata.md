---
id: 167
uid: 97b97d9b-c47f-49ba-acaa-01891fa3648a
title: Add size in cells and conformance level to component metadata
type: feature
status: backlog
milestone: primitives
depends_on:
- 47
- 123
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: docs
effort: s
---

## Problem

0147's component page shows a component's size in cells and the strictness level
it holds. The metadata (0047) has neither, because the levels did not exist yet.

## Acceptance criteria

- [ ] Each component's metadata states its minimum and default size in cells, read from its buffer function rather than written by hand
- [ ] It states the conformance level it holds, read from the conformance check (0123)
- [ ] The schema and the JSON Schema both carry the fields
