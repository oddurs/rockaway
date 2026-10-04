---
id: 172
uid: 7e8a4f9f-2b83-4658-90a6-66b41a0bcdc1
title: Decide whether the first release is 0.1.0 or 1.0.0
type: decision
status: done
milestone: v0.1
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: distribution
effort: s
---

## Context

Existing changesets mark `@rockaway/css` and `@rockaway/tokens` major, so the
first `changeset version` takes both from 0.0.0 to 1.0.0. The milestone is
called v0.1. Found by the Platform engineer (0162).

## Options

- **1.0.0.** Promises stability the API has not earned.
- **0.1.0, pre-1.0 semver.** Breaking changes are minors until 1.0.

## Decision

Decided 2026-10-03. **The first release is 0.1.0, for all four packages, under
pre-1.0 semver.**

- 1.0.0 would promise a stability the API has not earned. The public API
  (0153) is not decided yet, `data-*` context attributes are about to be
  renamed (0180), and the token files changed shape twice this month (0052,
  0065). A 1.0 that breaks in its first month spends the trust the number is
  for.
- Until 1.0, a breaking change is a **minor** whose changeset begins
  `Breaking:` and says what a user has to change. An addition is a minor, a fix
  is a patch.
- The seven major changesets are rewritten as minors with `Breaking:` first
  lines. `changeset status` now gives 0.1.0 for `@rockaway/css`, `grid`,
  `react` and `tokens`. Every one of them already had a minor, so all four
  start together without a `fixed` group.
- `scripts/check-changeset.ts` holds it. CI refuses a major changeset for a
  package still at 0.x, and a changeset that begins `Breaking:` when every
  package in it is a patch.

## Consequences

Consumers pin `~0.1`, and CONTRIBUTING says so: a minor can break. 1.0 becomes
a deliberate decision of its own, taken when the public API (0153) has held
through a release. After 1.0, the strict rules come back and a breaking change
is a major again. Neither `changeset version` nor a publish happens here; both
are the owner's to approve.

## Result

The first release is 0.1.0 for all four packages, under pre-1.0 semver. A breaking change is a minor whose changeset begins "Breaking:". The seven major changesets are rewritten as minors, and changeset status gives 0.1.0 for every package. check-changeset refuses a major below 1.0, and a "Breaking:" changeset that is only patches.
