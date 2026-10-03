---
id: 45
uid: 48568da8-ac11-44e4-9b4b-7009e1d25a7f
title: Publish the four packages to npm with Changesets and provenance
type: feature
status: backlog
milestone: v0.1
depends_on:
- 121
- 153
- 154
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: distribution
effort: m
---

## Problem

Four packages (`@rockaway/grid` publishes with tokens, css and react) have
never been published, and there is no release workflow, no CHANGELOG, and
thirty-odd changesets written during development that would turn 0.1.0's
changelog into a diary.

## Acceptance criteria

- [ ] `.github/workflows/release.yml` runs Changesets: a version pull request on every push to `main` with pending changesets, and a publish when it merges, gated by the `release` environment (0154)
- [ ] Published with npm trusted publishing and provenance; no npm token is stored in the repository
- [ ] The development-era changesets are folded into one "Initial release" entry per package, so 0.1.0's CHANGELOG reads as a release
- [ ] Every package starts at 0.1.0 and has a generated CHANGELOG.md
- [ ] Pull requests run `changeset status` and a `pnpm publish --dry-run` for every package
- [ ] A GitHub release with notes is created for each published version

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
