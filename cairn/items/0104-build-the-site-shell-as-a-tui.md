---
id: 104
uid: 562ba731-e93f-474e-a13e-938b31be29ad
title: Build the site shell as a TUI
type: feature
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 98
- 103
- 126
- 135
- 136
- 137
- 141
- 143
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: site
effort: l
---

## Proposal

Panes, a status bar, a navigation tree and keyboard navigation — built from the
system's own components, because that is the whole argument.

## Acceptance criteria

- [ ] Split panes (0136): navigation (a Tree, 0137), content, and a context pane that collapses under 80 cells; at 40 cells the panes stack
- [ ] `j`/`k` and arrows move; `?` shows help generated from the keymap (0141); `g` then a letter jumps
- [ ] Every keyboard route is also an ordinary link, so it is a website first and a TUI second
- [ ] The status bar (0098) says where you are and what the keys do
- [ ] Landmarks (`nav`, `main`, `complementary`) and a skip link, and the URL is the state: every pane's selection is linkable
- [ ] Markdown content is set by the prose styles (0143) with no per-page CSS
- [ ] No component that is not in `@rockaway/react`: if the site needs it, the system grows it

The palette's `⌘K` and `/` live in 0149, so the shell does not wait for 0102.

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
