---
id: 337
uid: a48a27f3-f983-48e9-8aa4-f28f347e6b0b
title: Decide whether menus are comfortable by default in an app
type: decision
status: backlog
milestone: primitives
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: components
effort: s
---

## Context

0311 made forms comfortable by default, and compact a deliberate choice for toolbars and dense tools. Menus gained comfort in 0317 (#256) but stay compact by default, a terminal's menu, so nothing that exists changes. An app built for the web may want its menus to breathe by default, and a TUI-like tool may not. The owner should choose.

## Options

1. Compact by default (today). A comfortable menu is asked for.
2. Comfortable by default, compact asked for, as forms are.
3. Follow the region: a menu takes the comfort of the screen it was opened from, as an overlay already takes its density.

## Decision

## Consequences
