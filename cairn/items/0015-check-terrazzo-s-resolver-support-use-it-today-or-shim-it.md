---
id: 15
title: 'Check Terrazzo''s Resolver support: use it today, or shim it?'
type: spike
status: done
milestone: tokens
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: s
---

## Question

Does Terrazzo's current release handle the DTCG 2025.10 Resolver module well
enough to express light and dark? If not, is Style Dictionary v5 better, or is a
thin shim enough?

## Time box

One day.

## Findings

Spike, 2026-09-22, against `@terrazzo/cli` and `@terrazzo/plugin-css` 2.7.1 with
a sample shaped like 0016: a semantic set aliasing `palette.*`, a `mode`
modifier holding per-mode palettes, a `density` modifier holding `space.*` and
`size.*`, all tied together by a DTCG 2025.10 resolver document.

- **The Resolver module works.** `tokens: ['rockaway.resolver.json']` is read as a resolver; aliases from the semantic set into modifier contexts resolve.
- **`permutations` is the CSS API.** Each entry takes a resolver `input`, a `prepare(contents)` wrapper that chooses selectors, and `include`/`exclude` globs. `baseSelector` and `modeSelectors` are deprecated for 3.0.
- **Gamut mapping is built in.** Colours outside sRGB are mapped for the base output, and the unmapped values are emitted under `@media (color-gamut: p3)` and `(color-gamut: rec2020)`. The dark accent (L 0.74 C 0.15) came out as `oklch(73.49% 0.1372 260.3)` for sRGB. This is 0018's "clamped for sRGB, P3 kept where available", for free.
- **Aliases are re-emitted per permutation.** The dark block redeclares `--rk-bg-page: var(--rk-palette-neutral-2)` next to the dark palette. That is what makes nested theme islands work: an element with `[data-theme='dark']` recomputes its semantic variables from its own palette, instead of inheriting values already resolved at `:root`.
- **Partial resolution (`only`) fails for us.** It requires an orthogonal resolver, and ours is not: the semantic set aliases the mode palettes. `include` globs give the same deduplication.
- **Not supported: `light-dark()` output.** Terrazzo emits one block per context. A `light-dark()` pair per variable would need a custom plugin.
- **Indentation** is inferred from where `${contents}` sits in the `prepare` template.

## Recommendation

**Use Terrazzo 2.7 with `plugin-css` permutations. No shim.**

- Mode: the light permutation at `:root`; the dark permutation under both `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }` and `[data-theme='dark']`, with `include: ['palette.**', 'bg.**', 'fg.**', 'border.**', 'shadow.**']` so only mode-dependent tokens repeat. Each block sets `color-scheme`.
- Density: `[data-density='compact']` and `[data-density='comfortable']` with `include: ['space.**', 'size.**']`. Density tokens stay raw values, never aliases, so islands work without re-emission.
- Do not chase `light-dark()`. Per-context blocks are what Terrazzo does well, gamut blocks included, and `[data-theme]` islands give the same capability.
