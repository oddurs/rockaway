---
id: 87
title: Make the text snapshot the house test for components
type: chore
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 83
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: tooling
effort: m
---

## Proposal

A helper that renders a story and returns the screen as characters, so a diff
reads like the screen.

## Acceptance criteria

- [x] `screenshot(story)` returns text from the DOM, in cells, with attributes as a legend
- [x] Works in the browser runner and in Node
- [x] A changed snapshot shows before and after as two screens, aligned
- [x] Every component ships one, and it counts as documentation
