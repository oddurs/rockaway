---
id: 84
title: Paint to ANSI
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 70
- 82
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p1
layer: grid
effort: m
---

## Proposal

The export that makes the terminal claim honest: a screen as escape sequences.

## Acceptance criteria

- [x] 16-colour, 256-colour and truecolor output, chosen by capability
- [x] Attributes map to SGR codes: bold, dim, reverse, underline
- [x] `NO_COLOR` and a non-TTY both fall back to plain text
- [x] Snapshot tests over the escape sequences, not just the visible characters
