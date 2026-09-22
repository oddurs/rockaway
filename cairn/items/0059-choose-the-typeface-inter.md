---
id: 59
title: 'Choose the typeface: Inter'
type: decision
status: ready
milestone: tokens
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: s
---

## Context

The default pairing has to be neutral, legible at 12px, strong at 72px, and
available everywhere. It is also the one input most likely to be swapped per
theme, so it must be a token and nothing else.

## Options

- **Inter**: the most thoroughly engineered UI face; v4 ships an optical-size axis, so display sizes tighten themselves
- Geist: used on the concept canvas; fine, younger, fewer features
- System stack: zero cost, and different on every platform

## Decision

Inter, as the variable font with the `opsz` axis (`font-optical-sizing: auto`).
Still to settle here:

- [ ] Self-host the variable woff2, or rely on consumers
- [ ] Default features: `cv11` (single-storey a)? `ss03`? Tabular figures in tables and inputs only
- [ ] The mono companion (Geist Mono, JetBrains Mono, or the system mono)
- [ ] Letter-spacing per size step, or trust `opsz` alone

## Consequences

Type pairing stays an input: Editorial swaps the display face to a serif,
Instrument swaps labels to mono. Inter is the default, not a dependency.

## 2026-09-22

Inter is decided (2026-09-22). The open checkboxes are what is left.
