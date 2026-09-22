---
id: 16
title: 'Define the token taxonomy and naming: reference, semantic, component'
type: decision
status: done
milestone: tokens
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Context

The one rule: components consume semantic tokens only. The taxonomy has to make
that rule easy to follow and easy to lint.

## Options

For colour, the question is where a mode lives:

- **One palette, a semantic tier per mode.** Common, but the semantic tier is written twice and the two copies drift
- **A palette per mode, one semantic tier.** Radix's model: each palette step has a job (step 9 is the solid, step 12 is text), so `fg.default` is `neutral.12` in both modes and only the palette changes

For the prefix: `--ds-` is generic and collides with any other system on the page.

## Decision

Decided 2026-09-22.

**Prefix: `rk`.** Custom properties are `--rk-*`, classes `.rk-*`, cascade layers
`rk.*`. The prefix is public API forever, so it changes now while it is free.

**Names are DTCG paths**, lower-case, dot-separated, named by intent. The CSS
name is the path joined with `-`: `fg.muted` → `--rk-fg-muted`.

**Three tiers:**

| Tier | Groups | Who may read it |
| --- | --- | --- |
| Reference | `palette.{neutral,accent,info,success,warning,danger}.{1–12}`, `font.family.*`, `font.weight.*` | the semantic tier only |
| Semantic | `bg.*`, `fg.*`, `border.*`, `space.*`, `size.*`, `radius.*`, `shadow.*`, `text.*`, `motion.*`, `focus.*` | components |
| Component | `{component}.{part}.{property}`, e.g. `button.primary.bg` | that component only |

**Palettes are per mode, with fixed step roles** (the Radix model). The `mode`
context overrides `palette.*` and nothing else; the semantic tier is written
once.

| Step | Role |
| --- | --- |
| 1 | raised surface (cards, panels) |
| 2 | page background |
| 3–5 | element background: rest, hover, active |
| 6–8 | border: subtle, default, strong |
| 9–10 | solid fill and its hover |
| 11 | low-contrast text |
| 12 | high-contrast text |

Steps are roles, not a lightness ramp: in dark mode the raised surface (1) is
lighter than the page (2), as it is in light mode.

**Contexts touch one tier each:** `mode` overrides `palette.*`; `density`
overrides `space.*` and `size.*`. A theme (the five inputs) regenerates
everything.

**Space is semantic by step.** `space.1` … `space.16` are multiples of the 4px
unit, already abstract, so components may use them directly. The unit is what
density changes.

**Component tokens are the exception.** One is added only when a component
needs a knob that no semantic token expresses, and never for a value that
merely happens to be shared.

## Consequences

- The rule is lintable: a component stylesheet may reference `--rk-palette-*` nowhere. A Biome or Stylelint rule enforces it once components exist
- Adding a mode (increased contrast, 0065) means adding one palette per hue, not rewriting the semantic tier
- Renaming a semantic token is a major release (0011); palette steps are internal and can change in a minor
- The `ds` prefix in the scaffold is renamed to `rk` in the same change as this decision
