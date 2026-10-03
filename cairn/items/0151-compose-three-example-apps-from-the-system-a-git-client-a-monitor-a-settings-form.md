---
id: 151
uid: da308364-3422-4766-8c64-7baf314430d7
title: 'Compose three example apps from the system: a git client, a monitor, a settings form'
type: feature
status: backlog
milestone: site
depends_on:
- 35
- 36
- 42
- 57
- 98
- 101
- 104
- 136
- 137
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: site
effort: l
---

## Problem

Components on their own pages prove the parts. Whether the system can build a
whole screen someone would want to use is a different claim, and it is the
claim a TUI audience will test first. They are also the compositions the
copy-in registry (0046) serves.

## Proposal

Three full-screen examples on the site, each built only from
`@rockaway/react`, each also published as a registry item:

- **A git client**: panes, a tree of files, a diff in a CodeBlock, a commit
  form, a status bar with key hints.
- **A system monitor**: tables that update, progress bars, sparklines, a
  spinner, all on a tick.
- **A settings form**: every field component, a fieldset, validation, a
  confirmation dialog.

## Acceptance criteria

- [ ] Each example is a page on the site, works by keyboard alone, at 40 and 120 cells, and at touch density
- [ ] Each passes axe, conformance and continuity in the built site
- [ ] Each uses nothing outside `@rockaway/react` and `@rockaway/css`: no local components, no local CSS beyond layout
- [ ] Each can be copied as text and as ANSI (0105), and looks right when the ANSI is pasted into a terminal
