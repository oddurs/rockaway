---
id: 172
uid: 7e8a4f9f-2b83-4658-90a6-66b41a0bcdc1
title: Decide whether the first release is 0.1.0 or 1.0.0
type: decision
status: backlog
milestone: v0.1
created: 2026-10-03
updated: 2026-10-03
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

Proposed: 0.1.0. Until 1.0, a breaking change is written as a minor and says so
in its first line. The existing major changesets are rewritten as minors.

## Consequences

Consumers pin `~0.1`. 1.0 becomes a deliberate decision of its own.
