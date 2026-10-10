---
id: 353
uid: 51e1c45c-e9cd-4a2a-a3e2-13393785ca24
title: Hold the components that landed since 0289 at strict, or declare standard
type: chore
status: backlog
milestone: v0.1
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: components
---

0289 pinned a strict story for every component there was then. Since, these parts read standard in the metadata (0167): AlertDialog, Card, CodeBlock, CodeSnapshot, LinkTree, Panes, StatusBar (and its segments), Tabs (and its parts), Text and Toolbar (and its parts); Description and FieldFrame were standard already. Under the three tiers (0311) standard is right for some: Card and Toolbar space themselves in half-steps by design. For each, add a story pinned at strict, or declare standard with its reason in the metadata.

## Acceptance criteria

- [ ] Each part listed is held at strict by a story, or declares standard with a reason
