---
id: 59
title: 'Choose the typeface: Inter'
type: decision
status: done
milestone: tokens
assignee: Oddur Sigurdsson
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

**Inter**, variable, with the optical-size axis (`font-optical-sizing: auto`).
Settled 2026-09-22; the four open questions:

- [x] **Loading: consumers own it.** Tokens name the family; no package ships font files. The docs recommend `@fontsource-variable/inter` (the workbench uses it). A metric-matched fallback face (`Inter Fallback`, local Arial with `size-adjust` and ascent/descent overrides) ships in the base CSS so a late load does not shift layout
- [x] **Features: Inter's defaults.** No stylistic sets by default; a theme can set them. Tabular figures (`tnum`) are applied where numbers align: tables, numeric inputs, meters. Exposed as `font.feature.numeric`
- [x] **Mono: the system stack.** `ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace`. Mono is rare in a UI (code, keys, token names), so it costs nothing by default; the `technical` pairing swaps in a real mono face
- [x] **Letter-spacing: trust `opsz`.** Inter 4 tightens itself at display sizes, so tracking tokens are `0` across the scale. Revisit only if the type scale review (0017) shows a size that needs it

| Token | Value |
| --- | --- |
| `font.family.sans` | `'Inter Variable', 'Inter', 'Inter Fallback', ui-sans-serif, system-ui, sans-serif` |
| `font.family.display` | same as sans for the default pairing |
| `font.family.mono` | the system mono stack above |
| `font.weight.{regular,medium,semibold,bold}` | 400, 500, 600, 700 |

## Consequences

Type pairing stays an input: Editorial swaps the display face to a serif,
Instrument swaps labels to mono. Inter is the default, not a dependency.

## 2026-09-22

Inter is decided (2026-09-22). The open checkboxes are what is left.
