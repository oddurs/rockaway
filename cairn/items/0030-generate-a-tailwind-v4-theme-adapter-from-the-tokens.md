---
id: 30
title: Generate a Tailwind v4 @theme adapter from the tokens
type: feature
status: done
milestone: runtime
assignee: Oddur Sigurdsson
depends_on:
- 20
created: 2026-09-22
updated: 2026-09-22
priority: p2
layer: distribution
effort: s
---

## Proposal

App teams get utilities that match the system. The system itself is not
written in Tailwind.

## Acceptance criteria

- [x] The `@theme` block is generated from the semantic tokens, never hand-edited
- [x] Utilities resolve to the same custom properties the components read
- [x] Spacing follows the density context
- [x] Proven by compiling real Tailwind utilities in a test
