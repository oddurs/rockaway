---
id: 67
key: grid
title: The frame engine
type: milestone
status: backlog
depends_on:
- 3
created: 2026-09-22
updated: 2026-09-22
priority: p2
due: 2026-12-06
---

The heart of a TUI system: a pure, integer model of a character grid, and
painters that put it on a screen.

Everything else waits on this, because a frame drawn four different ways has
to come from one geometry. Done means a screen can be composed in cells,
rendered to characters, to the DOM, to ANSI, and compared as text in a test.

Concept: https://claude.ai/artifact/7nLZVoPtzJqMJuciyhfZjV
