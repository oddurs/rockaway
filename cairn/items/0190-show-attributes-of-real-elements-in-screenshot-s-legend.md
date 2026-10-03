---
id: 190
uid: 0a353128-02ba-46a4-a1f2-22ff940c8cee
title: Show attributes of real elements in screenshot()'s legend
type: feature
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tooling
effort: s
---

## Problem

The legend lists attributes of painted runs only, so reverse video and underline
on real elements (List rows, Link) never appear in a text snapshot.

## Acceptance criteria

- [ ] The legend reads computed decoration and swapped colours on real elements
