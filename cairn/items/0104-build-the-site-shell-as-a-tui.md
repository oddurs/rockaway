---
id: 104
title: Build the site shell as a TUI
type: feature
status: backlog
milestone: site
depends_on:
- 103
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: site
effort: l
---

## Proposal

Panes, a status bar, a command palette and keyboard navigation — built from the
system's own components, because that is the whole argument.

## Acceptance criteria

- [ ] Split panes: navigation, content, and a context pane that collapses under 80 cells
- [ ] `⌘K` and `/` open the palette; `j`/`k` and arrows move; `?` shows help; `g` then a letter jumps
- [ ] Every keyboard route is also an ordinary link, so it is a website first and a TUI second
- [ ] The status bar says where you are and what the keys do
- [ ] No component that is not in `@rockaway/react`: if the site needs it, the system grows it
