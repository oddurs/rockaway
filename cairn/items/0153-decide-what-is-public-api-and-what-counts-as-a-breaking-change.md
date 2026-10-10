---
id: 153
uid: c5002876-9ec9-4d15-82ee-81fd3830daab
title: Decide what is public API, and what counts as a breaking change
type: decision
status: done
milestone: v0.1
assignee: Oddur Sigurdsson
depends_on:
- 11
- 76
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: distribution
effort: s
---

## Context

0011 says packages follow semver strictly; 0076 says `data-*` attributes are
public API. Nothing says whether class names (`.rk-button`), CSS custom
properties, glyph tokens, the text snapshot format, the metadata schema or the
DOM structure under a component are. A consumer styling `.rk-list-item` and a
maintainer renaming it will disagree about whether that was a major release,
and after 0.1.0 that disagreement is somebody's broken build.

## Options

- **Everything visible is API.** Honest, and it freezes the DOM.
- **Only what is documented is API**, with the list written down and
  everything else explicitly internal.

## Decision

Decided 2026-10-03. **Only what is documented is API, and what is documented is
generated, so it cannot drift from the code.** Not "everything visible": that
would freeze the DOM between a component's parts, and the grid needs to keep
moving it, as 0116 and 0117 did.

Public:

- **JavaScript and TypeScript:** every name an entry point in `exports`
  exports.
- **Components:** the `.rk-*` class on each component root, and on each part
  its metadata names. Variant attributes and their values, and the React Aria
  state attributes a component draws.
- **Contexts:** mode, density, motion, theme, and `data-rk-fill`. Plus the
  utility classes, the cascade layer names and their order.
- **Tokens:** every token in the semantic tiers, by name — bg, fg, border,
  syntax, attribute, focus, motion, cell, space, row, size, stroke, glyph,
  conformance — together with theme names and the theme and terminal paths.
- **The text snapshot format,** and the metadata schema.

Internal: the reference tier (ansi, palette, font), any class no metadata
names, the DOM between parts, component-local custom properties, what the
painters write, the layout of the DTCG files, and token values. A changed value
is a minor.

The lists are not written by hand. Each package's tests write its `API.md` as a
file snapshot:

- grid: its exports, and the snapshot format printed;
- tokens: its exports, paths, theme names, and every public token by custom
  property;
- css: its layers, utilities and contexts, with every class and attribute in
  its base stylesheets declared public or internal, so a new one cannot ship
  unclassified;
- react: every entry point's exports, each component's public classes from its
  metadata, and its attributes.

A change to the public API is therefore a diff in review. A removal or rename
is breaking: on 0.x a minor whose changeset begins "Breaking:" (0172), and from
1.0 a major. `docs/public-api.md` is the page for people, linking the reports.

## Consequences

The site can render `docs/public-api.md` and link the reports. CONTRIBUTING
tells a contributor to read the `API.md` diff, and to write a "Breaking:"
changeset when it removes or renames something. Two pending changes are
already listed as breaking before 0.1.0: the `data-rk-*` rename (0180) and
`data-rk-contrast` (0065, #124).

## Result

Only what is documented is API, and the documentation is generated. Each package's tests write its API.md (exports, public classes and attributes, contexts, layers, public tokens, theme names, the snapshot format) as a file snapshot. docs/public-api.md lists the public and the internal surfaces. A removal or rename is breaking: a "Breaking:" minor on 0.x, a major from 1.0.
