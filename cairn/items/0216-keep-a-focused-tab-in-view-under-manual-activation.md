---
id: 216
uid: 2392dd7e-b684-40eb-95dc-d581ac975222
title: Keep a focused tab in view under manual activation
type: bug
status: review
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 40
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## What happens

When tabs scroll, the window is computed from the selected tab only, so under
manual activation a focused but unselected tab can sit out of view.

## Acceptance criteria

- [x] The focused tab is always in view, with a keyboard story under manual activation

## 2026-10-03

Fixed on #104 (feat/tabs). The window of tabs shown is computed from the focused tab while the keyboard is in the list (state.selectionManager.isFocused and focusedKey), and from the selected one otherwise, so under manual activation the arrows never move focus to a tab out of sight; when focus leaves the list the edge goes back to the selected tab. Proven by the 'Manual, overflowing' story: seven tabs in 28 cells, arrow through all of them, each focused tab unselected, in view and read back as tabsText at its index; then Tab out and the window returns. With the old window the story did not fail but hung the page (the run never finished, twice): worth knowing if a focused tab is ever clipped some other way.
