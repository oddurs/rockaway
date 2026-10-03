---
id: 164
uid: 1371d77c-ab10-489b-9913-16a3faa8cbe5
title: Make hover and pointer stories reliable in CI
type: chore
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: s
---

## Problem

A synthetic hover ended at once on Linux CI Chromium while passing locally, most
likely because the screen re-measures after the font loads and the browser
sends real boundary events. Link worked around it; every component with a
hover story will meet it.

## Acceptance criteria

- [ ] A shared helper in the workbench waits for fonts and two frames before a story measures or points, or hover is driven by the real pointer through `vitest/browser`
- [ ] Every existing hover story uses it, and a CI run repeated five times passes every time
- [ ] The recipe (0134) says to use it
