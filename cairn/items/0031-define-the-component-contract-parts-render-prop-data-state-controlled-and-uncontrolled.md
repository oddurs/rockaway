---
id: 31
title: 'Define the component contract: parts, render prop, data-* state, controlled and uncontrolled'
type: decision
status: backlog
milestone: primitives
depends_on:
- 8
- 9
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: components
effort: m
---

## Context

Composition over configuration. The contract every component follows, so that
consumers learn it once.

## Options

## Decision

To settle: compound parts with slots; polymorphism through `render`; variants
small and orthogonal; every component works controlled and uncontrolled; the
`data-*` attributes are documented as public API.

## Consequences
