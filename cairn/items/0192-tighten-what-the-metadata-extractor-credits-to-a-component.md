---
id: 192
uid: 8baee093-47ba-4a7f-8ae4-5476c3f4f439
title: Tighten what the metadata extractor credits to a component
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 47
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p3
layer: tooling
effort: s
---

## What happens

A compound selector like `.rk-frame-box > .rk-frame` is credited to every
component that writes `rk-frame`, and Screen-based components miss the stroke
tokens because `[data-rk-painted]` rules select no class.

## Acceptance criteria

- [x] A rule counts for a component only when every class in it is the component's
- [x] Components painted through Screen list the stroke tokens they use

## 2026-10-03

scripts/extract.ts now credits a rule through owns(). A selector's hooks are its rk-* classes and its data-rk-* attributes. The rule is a component's when it has at least one hook and the component's sources write every one. Classes come from strings as before; attributes from JSX data-* props, el.dataset.x assignments and 'data-*' strings. React Aria's state attributes and variants are not hooks. Effect: Frame, Divider, Fieldset and FieldFrame lose --rk-bg-surface, which came from '.rk-callout > .rk-content' because they write rk-content through Screen. Every component painted through paint/cells gains the six --rk-stroke-glyph-*/--rk-stroke-rule-* tokens from screen.css's [data-rk-painted] rules. data-attrs (the painter's per-cell bold/dim/reverse) is deliberately not a hook: whether a component draws those depends on its buffer, which the source does not say.

## Result

The extractor credits a rule only when every rk-* class and data-rk-* hook in it is the component's, so neighbours' rules no longer leak in and painted components list their stroke tokens.
