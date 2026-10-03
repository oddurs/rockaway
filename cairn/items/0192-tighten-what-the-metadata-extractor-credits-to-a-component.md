---
id: 192
uid: 8baee093-47ba-4a7f-8ae4-5476c3f4f439
title: Tighten what the metadata extractor credits to a component
type: bug
status: backlog
milestone: primitives
depends_on:
- 47
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tooling
effort: s
---

## What happens

A compound selector like `.rk-frame-box > .rk-frame` is credited to every
component that writes `rk-frame`, and Screen-based components miss the stroke
tokens because `[data-rk-painted]` rules select no class.

## Acceptance criteria

- [ ] A rule counts for a component only when every class in it is the component's
- [ ] Components painted through Screen list the stroke tokens they use
