---
id: 153
uid: c5002876-9ec9-4d15-82ee-81fd3830daab
title: Decide what is public API, and what counts as a breaking change
type: decision
status: backlog
milestone: v0.1
depends_on:
- 11
- 76
created: 2026-10-03
updated: 2026-10-03
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

To decide before 0.1.0. Proposed: public are the exported TypeScript API,
`data-*` state attributes, semantic and component tokens (by name), the
`.rk-*` classes on component roots and named parts only, the snapshot format,
and the metadata schema. Internal are reference tokens, inner DOM structure,
and any class not documented on a component page. While on 0.x, a breaking
change to public API is a minor release with a migration note; from 1.0, a
major.

## Consequences

The list is published on the site, and the changeset template asks which
public surface a change touches.
