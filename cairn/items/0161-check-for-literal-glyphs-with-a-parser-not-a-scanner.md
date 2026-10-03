---
id: 161
uid: 61d69138-0333-4ce5-8fa9-111b2205abec
title: Check for literal glyphs with a parser, not a scanner
type: chore
status: backlog
milestone: later
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tooling
effort: s
---

## Problem

`no-literal-glyphs.test.ts` (0119) strips comments with a small scanner, so an
apostrophe in JSX text can make it flag a glyph inside a comment. It cannot
miss a glyph in code, but it can fail on one that is not there.

## Acceptance criteria

- [ ] The check reads the source with a real parser (TypeScript's, or a Biome GritQL plugin) and judges only string and JSX text nodes
- [ ] The apostrophe case has a fixture that passes
