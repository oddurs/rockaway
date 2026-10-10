---
id: 64
uid: 96e76a96-8e2d-4480-bf0e-3503ea0bd9ac
title: 'Build the kitchen-sink screen: every component, with the theme inputs as controls'
type: feature
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-09
depends_on:
- 13
- 34
- 35
- 36
- 37
- 38
- 39
- 40
- 41
- 42
- 43
- 55
- 57
- 62
- 98
- 101
- 102
- 135
- 136
- 137
- 138
- 139
- 140
created: 2026-09-22
updated: 2026-10-09
priority: p1
layer: docs
effort: m
---

## Proposal

One screen, built only from the real components, that shows all of them at
once: the reference the design pass (0142) reviews against, and the screen the
site's landing page can reuse. It replaces the canvas's component sheet.

A 120 × 40 composition: panes (a tree, a table, tabs, a form of every field,
a list, a progress row, a status bar with key hints), with an open popover and
a menu in a second story, and a dialog over its backdrop in a third.

## Acceptance criteria

- [x] One story renders every component, and a test fails if a component exported from `@rockaway/react` is not on it
- [ ] Theme preset, mode, density, border set, conformance level and painter are Storybook controls, and switch without a rebuild
- [x] It passes conformance and continuity in every combination of the controls
- [x] Its text snapshot is checked in, so any component change shows up as a diff of the whole screen

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-09

Generated, not listed (the CTO's direction): each component's example is <name>.example.tsx beside it (moved from the site's islands in #215, stacked on #158), and the sink finds them with import.meta.glob and names each pane from the generated metadata registry. metadata.test fails a component without an example, so a new component's PR brings its own and edits nothing shared. The sink grows as the remaining dependencies (Popover, Dialog, Tooltip, Switch, Radio, Tabs, Menu, Select, Combobox, StatusBar, Progress, CommandPalette, Panes, CodeBlock) land with their examples.

## 2026-10-09

Criterion 2 is partly true: theme, mode, density and conformance are the toolbar's globals, border set and painter are story controls, and all switch without a rebuild. But painter reaches only the panes: there is no painter context, so the screens inside an example take their own painter prop (default glyph). A sink-wide painter needs a PainterProvider that Screen reads by default, a core change; proposed as a follow-up. Criterion 3 is covered value by value, not as the full product (10 themes x 6 border sets x 2 painters x 3 levels x 2 modes x 4 densities): Everything walks every density and mode at strict; each border set and the rule painter walk every density in light (they change strokes, not colour); each theme walks normal light (colours and glyphs, no geometry). All 16 stories pass locally, Everything 11.6s, the rest 2-9s.

## 2026-10-09

Found by the sink: List's reserved cells collapsed in prose (white-space normal), sitting half a row down; fixed in #217. Also seen: Frame's site example puts a line of content on its divider's row (├─fg.muted──┤), for the design pass. A ResizeObserver 'undelivered notifications' notice appears once per density switch in a page of nested measured screens; it fails nothing, and no example alone or the sink alone at one density produces it.

## 2026-10-09

Criterion 3 ticked on the CTO's ruling: covering each control's values, walked where they change something (Everything at every density and mode at strict; each border set and the painter at every density in light; each theme at normal light), suffices, as for the site's switcher. Criterion 2 stays partial until the PainterProvider ticket (batch 11). Frame's example no longer writes on its divider's row (fixed in #215).
