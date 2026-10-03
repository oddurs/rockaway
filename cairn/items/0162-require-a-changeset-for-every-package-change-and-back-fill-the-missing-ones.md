---
id: 162
uid: e721895a-3149-44d5-8dbd-245260479b42
title: Require a changeset for every package change, and back-fill the missing ones
type: chore
status: done
milestone: v0.1
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] CI fails a pull request that changes `packages/*/src` without a changeset, with an escape hatch for changes that genuinely do not reach users (tests, comments) that has to be written out
- [x] Every user-facing change merged since the last changeset has one, written in the voice of the rest
- [x] `CONTRIBUTING.md` says when a change needs a changeset and what makes it major, minor or patch

## 2026-10-03

Audit of every merge to main that touched packages or .changeset: every PR from #2 to #45 carried a changeset. Missing were #50 Frame, #51 Divider, #52 Button, #53 KeyHint, #54 List, #62 variants and #64 theme glyphs, now back-filled as frame, divider, button, key-hint, list, variants and theme-glyphs.md, all minor because each adds without removing. Not user-facing, so no changeset: #48 (an unused parameter dropped in tokens' generate.ts), #65 (barrels; the public API is the same 52 names) and #69 (cairn only).

## 2026-10-03

scripts/check-changeset.ts takes 'what a package ships' to be src plus every entry in its files except dist, which src stands in for. Every such package changed since the merge-base with the base branch, including uncommitted and untracked files, must be named in a changeset the branch adds or edits. The escape hatch is the empty changeset Changesets already supports (pnpm changeset --empty), and it passes only with a reason in its body. Tried locally against four cases: a src change with no changeset fails, an empty changeset without a reason fails, one with a reason passes, and a named one passes. CI runs it as its own job, on pull requests only, with the full history checked out. pnpm check runs it too.

## 2026-10-03

Not covered: a change to a package's package.json alone, such as exports or dependencies. Many package.json edits are devDependencies or scripts, and telling them apart reliably needs a diff of the manifest. Left for review rather than guessed at.

## Result

CI's changeset job fails a pull request that changes what a package ships (src or its files) without naming it in a changeset; a reasoned empty changeset is the escape hatch. Back-filled Frame, Divider, Button, KeyHint, List, variants and theme glyphs. CONTRIBUTING says when a changeset is needed and what is major, minor or patch.

## 2026-10-03

After rebasing onto #66 and #68: #66 (motion as ticks) carries its own changeset, and #68 Link did not, so link.md is back-filled too.
