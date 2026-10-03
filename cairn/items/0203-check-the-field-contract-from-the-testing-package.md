---
id: 203
uid: d3cd9fbf-f3e4-4dfd-a695-6ede9b8b4dd8
title: Check the field contract from the testing package
type: feature
status: backlog
milestone: primitives
depends_on:
- 127
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: s
---

## Problem

A field author must pass `isRequired` to `Label` by hand (0127): React Aria puts
required in no context a label can read. Forgetting it is the field contract's
one remaining footgun.

## Acceptance criteria

- [ ] `checkField(root)` in `@rockaway/react/testing` asserts the required mark matches `aria-required`, the description and error are in `aria-describedby`, no name holds a glyph, and no live region is used
- [ ] Every field component's stories run it
