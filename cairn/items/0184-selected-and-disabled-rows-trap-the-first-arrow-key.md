---
id: 184
uid: d3a1824f-2a5b-4592-981c-c3ed821db26e
title: Selected-and-disabled rows trap the first arrow key
type: bug
status: backlog
milestone: primitives
depends_on:
- 133
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## What happens

In a List with a row that is both selected and disabled, Tab focuses the first
row and the first ArrowDown does nothing. React Aria's focused key appears to
start on the disabled selected row. Found in 0133.

## Acceptance criteria

- [ ] A story reproduces it
- [ ] Fixed here, or reported upstream with the issue linked and a workaround in place
