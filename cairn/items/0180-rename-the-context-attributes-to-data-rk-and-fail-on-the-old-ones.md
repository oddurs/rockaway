---
id: 180
uid: 7ec8ac7a-b207-4027-9d63-272482db3b89
title: Rename the context attributes to data-rk-*, and fail on the old ones
type: chore
status: backlog
milestone: primitives
depends_on:
- 52
- 179
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: css
effort: s
---

## Problem

0179 decides the names. The rename has to happen before 0148 documents them.

## Acceptance criteria

- [ ] Mode, theme, density, motion and conformance are set by `data-rk-mode`, `data-rk-theme`, `data-rk-density`, `data-rk-motion` and `data-rk-conformance` everywhere: tokens output, CSS, React, workbench, site
- [ ] A test fails on any unprefixed context attribute in source, stories or the site
- [ ] `docs/concept.md` and the READMEs use the new names
- [ ] A changeset records it as breaking, written as a minor per 0172
