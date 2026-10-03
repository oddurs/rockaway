---
id: 208
uid: 5dc4f0bc-eb02-41d2-a069-135c3bb8f210
title: Hide every native scrollbar, show position in cells, and check it after every story
type: bug
status: backlog
milestone: primitives
depends_on:
- 207
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: css
effort: m
---

## What happens

0207. List draws two scrollbars and goes off the grid with classic scrollbars;
prose code and tables scroll natively; CodeBlock (#103) and Tabs (#104) are in
review and must follow the same rule.

## Acceptance criteria

- [ ] One shared rule in `@rockaway/css` hides the native scrollbar on every scroll region (`scrollbar-width: none` plus `::-webkit-scrollbar`), and List, prose code blocks and prose tables use it
- [ ] A check after every story fails any element whose computed overflow scrolls without `scrollbar-width: none`, with a fixture proving it fails
- [ ] A run with classic scrollbars forced on, if Chromium allows it, shows List conforming and one scrollbar only; if it cannot be forced, the item says why
- [ ] Horizontally scrolling prose shows `mark.overflow-start`/`-end` at the edge with more (this absorbs 0187)
- [ ] `docs/concept.md` states the rule, and the recipe (0134) says how a new scroll region shows its position
