---
id: 11
title: 'Choose the distribution model: versioned package plus copy-in registry'
type: decision
status: done
milestone: foundations
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: distribution
effort: s
---

## Context

Some things must stay consistent everywhere (tokens, CSS, primitives), and some
must be owned and changed by the teams using them (compositions, patterns).

## Options

- **Package only** — consistent, but teams fork to customise
- **Registry only (shadcn-style)** — owned, but drifts
- **Hybrid** — package what doesn't vary, copy in what teams will change

## Decision

**Hybrid**, decided 2026-09-22.

| Ships as a versioned package | Ships through the copy-in registry |
| --- | --- |
| `@rockaway/tokens`: DTCG sources, resolver, CSS variables | Compositions: forms, empty states, page shells |
| `@rockaway/css`: layers, reset, base, component styles | Patterns a team is expected to edit |
| `@rockaway/react`: primitives and their behaviour | |

The rule: if two apps disagreeing about it would be a bug, it is a package. If
two apps disagreeing about it is the point, it is registry code.

## Consequences

- Packages are versioned independently with Changesets and follow semver strictly; a changed semantic token is a minor release, a removed one is major
- Registry items only import from the packages, never from each other, so copying one never drags in another
- The registry format is shadcn's, so existing tooling and agents can install from it
