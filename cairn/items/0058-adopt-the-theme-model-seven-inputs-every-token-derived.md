---
id: 58
title: 'Adopt the theme model: seven inputs, every token derived'
type: decision
status: done
milestone: tokens
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Context

The concept canvas showed one component sheet rendered from seven
inputs, and three variants (Editorial, Instrument, Soft) that are the same sheet
with different inputs. The proportions never change; the inputs do.

## Options

- **Hand-authored tokens per theme**: flexible, but every theme is a full copy and drifts
- **Seven inputs, derived tokens**: a theme is a handful of values; the rules live in one generator

## Decision

Seven inputs, split by *when* they vary:

| Input | Default | Kind |
| --- | --- | --- |
| Accent hue | 262 | theme (build time) |
| Neutral temperature | neutral (cool / neutral / warm) | theme (build time) |
| Radius | 6px | theme (build time) |
| Type pairing | Inter | theme (build time) |
| Elevation | border (border / shadow / tone) | theme (build time) |
| Mode | light, dark | **context** (resolver modifier, switched at runtime) |
| Density | regular (compact / regular / comfortable) | **context** (resolver modifier, switched at runtime) |

Themes are brands; contexts are what a user or a surface switches. Only
contexts go through the DTCG Resolver.

Derivation rules, as proven on the canvas:

- **Neutrals**: OKLCH, hue from temperature (cool 250, warm 75, neutral = accent hue), chroma 0.006 neutral / 0.014 tinted
- **Accent**: L 0.52 C 0.17 in light, L 0.74 C 0.15 in dark; on-accent white / near-black
- **Status hues**: info = accent, success 150, warning 75, danger 27, same lightness recipe
- **Space**: 4px grid × density multiplier (0.75 / 1 / 1.25); control height 32 / 38 / 44
- **Radius**: control = r, card = 1.5r, overlay = 1.25r, tag = 0.75r (min 3), checkbox capped at 5; r = 0 squares everything, pills included

## Consequences

The generator becomes the most important code in the tokens package. The DTCG
files it writes are committed and reviewed, so Figma and other tools read real
DTCG, not the inputs.

## 2026-09-22

Decided 2026-09-22: the default-plus-variants concept was chosen on the canvas, with Inter replacing Geist as the default face.

## 2026-09-23

The canvas this cites has since been deleted, and this decision was superseded
by the retheme milestone: 0092 retired radius and shadow, 0089 replaced the
twelve-step palette with the ANSI 16, and the type scale went with them. What
survives is the shape of the decision — a theme is a handful of inputs, every
token derived — now five inputs instead of seven. See docs/concept.md.
