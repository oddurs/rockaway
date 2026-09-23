---
id: 92
title: Retire radius, shadow and the type scale
type: chore
status: done
milestone: retheme
assignee: Oddur Sigurdsson
depends_on:
- 75
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [x] The generator no longer emits them, and the tests that pinned them go with their reasons recorded
- [x] The semantic tier keeps its names, so component CSS still resolves
- [x] A changeset marks the major break, with a migration note saying what to use instead

## 2026-09-23

Taken before 0089: radius, shadow and the type scale are what the twelve-step palette holds up, so retiring them first makes the ANSI swap a clean replacement rather than a migration of things that are about to go.

## 2026-09-23

Also found: conformance was identifying painted chrome by class, so the rule painter's half-cell strokes were flagged as violations in a story that painted into a plain div. Painters now mark the layer they paint (data-rk-painted) and the check skips that, which is what it meant all along.
