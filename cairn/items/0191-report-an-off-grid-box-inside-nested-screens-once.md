---
id: 191
uid: ea932758-b9e8-4448-b729-d81b74a91475
title: Report an off-grid box inside nested screens once
type: bug
status: backlog
milestone: primitives
depends_on:
- 123
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tooling
effort: s
---

## What happens

An off-grid box inside a nested screen is reported by the outer and the inner
check both.

## Acceptance criteria

- [ ] Each violation appears once in the report, attributed to the innermost screen
