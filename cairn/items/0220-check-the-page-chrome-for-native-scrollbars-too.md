---
id: 220
uid: be28b766-9dda-4728-86d1-7c02d0760eb4
title: Check the page chrome for native scrollbars too
type: chore
status: backlog
milestone: primitives
depends_on:
- 208
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tooling
effort: s
---

## Problem

The native-scrollbar check covers each story's canvas only; the workbench and
site chrome around it could still draw a native bar.

## Acceptance criteria

- [ ] The site test and the workbench check the page as a whole
