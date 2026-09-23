---
id: 87
title: Make the text snapshot the house test for components
type: chore
status: backlog
milestone: grid
depends_on:
- 83
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tooling
effort: m
---

## Proposal

A helper that renders a story and returns the screen as characters, so a diff
reads like the screen.

## Acceptance criteria

- [ ] `screenshot(story)` returns text from the DOM, in cells, with attributes as a legend
- [ ] Works in the browser runner and in Node
- [ ] A changed snapshot shows before and after as two screens, aligned
- [ ] Every component ships one, and it counts as documentation
