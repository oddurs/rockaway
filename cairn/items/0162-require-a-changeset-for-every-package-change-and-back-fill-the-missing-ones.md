---
id: 162
uid: e721895a-3149-44d5-8dbd-245260479b42
title: Require a changeset for every package change, and back-fill the missing ones
type: chore
status: backlog
milestone: v0.1
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: distribution
effort: s
---

## Problem

Changesets is set up (0012) but nothing enforces it. #62 (variants), #64 (theme
glyphs) and the component PRs before them shipped without one, so the first
release's changelog would be missing most of what it contains. Noticed by the
tokens engineer while writing 0120's.

## Acceptance criteria

- [ ] CI fails a pull request that changes `packages/*/src` without a changeset, with an escape hatch for changes that genuinely do not reach users (tests, comments) that has to be written out
- [ ] Every user-facing change merged since the last changeset has one, written in the voice of the rest
- [ ] `CONTRIBUTING.md` says when a change needs a changeset and what makes it major, minor or patch
