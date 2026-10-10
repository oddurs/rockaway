---
id: 344
uid: 88d23ac2-c366-4421-bb61-4c3186625051
title: Audit single-probe measurements for the 1/64px bias
type: chore
status: backlog
milestone: v0.1
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: grid
---

`measureCell` read one probe and inherited a sub-pixel bias (tokens' handoff). The site and the conformance helpers may measure the same way. Find each and measure as `measureCell` now does.

## Acceptance criteria

- [ ] Every single-probe measurement is listed in a note, and each is fixed or shown harmless
