---
id: 23
title: Generate a token reference page from the sources
type: docs
status: done
milestone: tokens
assignee: Oddur Sigurdsson
depends_on:
- 20
created: 2026-09-22
updated: 2026-09-22
priority: p2
layer: docs
effort: s
---

## 2026-09-22

Built as workbench stories under Foundations/Tokens, read straight from the generated DTCG files so the reference cannot drift. Each page runs axe; the semantic page checks it has one row per token, and the motion page checks that every entry in the vars map resolves to a value in the compiled CSS.
