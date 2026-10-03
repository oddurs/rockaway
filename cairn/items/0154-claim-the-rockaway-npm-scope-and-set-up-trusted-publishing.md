---
id: 154
uid: b11a71d2-f95a-44dd-abfb-0dd2b914102a
title: Claim the @rockaway npm scope and set up trusted publishing
type: chore
status: backlog
milestone: v0.1
labels:
- needs-owner
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: distribution
effort: s
---

**Needs the human owner.** Publishing rights, an npm account and 2FA cannot be
delegated to an agent. Do this early: if the scope is taken, every package
name, import and doc changes, and that is cheaper now than in March.

## Acceptance criteria

- [ ] The `@rockaway` scope exists on npm and belongs to the owner (or a decision is recorded here to rename, with the new scope)
- [ ] Trusted publishing (OIDC) is configured on npm for `oddurs/rockaway`'s release workflow, for all four packages, so no long-lived token is stored in the repository
- [ ] The `release` environment in GitHub requires the owner's approval to run
