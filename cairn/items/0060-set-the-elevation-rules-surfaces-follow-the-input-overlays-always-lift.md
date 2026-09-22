---
id: 60
title: 'Set the elevation rules: surfaces follow the input, overlays always lift'
type: decision
status: ready
milestone: tokens
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: tokens
effort: s
---

## Context

Elevation is an input (border, shadow or tone). The canvas showed that menus,
dialogs, toasts and tooltips become unreadable if they follow it too: a
border-only menu disappears into the page.

## Decision

- Resting surfaces (cards, panels, tables) follow the elevation input
- Overlays always get `shadow.overlay` plus a hairline border, in every theme
- Tone elevation moves the page to `surface.subtle` and removes card borders

## Consequences

Two shadow tokens are fixed across themes (`shadow.overlay`, `shadow.control`);
only `shadow.surface` varies with the input.
