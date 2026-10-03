---
id: 179
uid: 29e48791-60cb-461f-a782-59ce2a5c0352
title: Namespace every context attribute as data-rk-*
type: decision
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: css
effort: s
---

## Context

Contexts are set by attributes on any element: mode as `data-theme`, density as
`data-density`, motion as `data-motion`, conformance as `data-rk-conformance`,
and now the theme itself as `data-rk-theme` (0052). So `data-theme` means mode
and `data-rk-theme` means theme — backwards to anyone reading it, and
unprefixed `data-theme` on `<html>` collides with other libraries. Raised by
the tokens engineer before the site's switcher (0148) bakes the names in.

## Options

- **Swap the meanings** (`data-mode` for mode, `data-theme` for theme). Any code
  still writing `data-theme="dark"` would silently ask for a theme called
  "dark". The worst kind of break.
- **Namespace them all.** Old attributes stop working outright, and a test can
  fail on any that remain.

## Decision

Every context attribute is `data-rk-*`: `data-rk-mode`, `data-rk-theme`,
`data-rk-density`, `data-rk-motion`, `data-rk-conformance`. Internal markers
(`data-rk-painted`, `data-rk-shape`, `data-rk-offgrid`) already are.

## Consequences

One mechanical rename across tokens, CSS, React, the workbench and the site,
done once, before the site documents the names. Nothing has been published, so
nobody outside has anything to migrate.
