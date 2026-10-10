---
id: 343
uid: b248f36b-5ea5-4be2-8d16-eff264abc779
title: 'Fix the site budget flake: ''response.body: Target page closed'''
type: bug
status: backlog
milestone: v0.1
created: 2026-10-10
updated: 2026-10-10
priority: p3
layer: tooling
---

`apps/web/test/budget.test.ts` (line 214) failed once on #221 with `response.body: Target page closed`, and passed on a rerun. A response body read after its page closes; read bodies before closing, or await them with the navigation.

## Acceptance criteria

- [ ] The budget test reads every response body before its page closes
