---
id: 60
title: 'Set the elevation rules: surfaces follow the input, overlays always lift'
type: decision
status: done
milestone: tokens
assignee: Oddur Sigurdsson
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

Decided 2026-09-22, as proven on the concept canvas.

- **Resting surfaces follow the elevation input.** Cards, panels and tables read `shadow.surface` and `border.surface`, which the generator sets per input:

  | Input | `border.surface` | `shadow.surface` | Page background |
  | --- | --- | --- | --- |
  | `border` | `border.default` | none | `bg.page` |
  | `shadow` | a faint border (palette step 6 at reduced alpha) | two-layer soft shadow | `bg.page` |
  | `tone` | transparent | none | `bg.subtle`, so surfaces separate by tone alone |

- **Overlays always lift.** Menus, popovers, dialogs, toasts and tooltips read `shadow.overlay` and keep a hairline `border.default`, in every theme and mode.
- **Controls get a hairline.** Secondary buttons and inputs read `shadow.control`: a 1px low-alpha drop in light mode, none in dark, where it cannot be seen.
- **Shadows are tinted with the neutral hue**, never pure black, so they sit in the palette. Dark mode uses deeper, higher-alpha shadows.

## Consequences

- Three shadow tokens: `shadow.control`, `shadow.surface` (varies with the input), `shadow.overlay` (fixed across inputs)
- One border token varies with the input: `border.surface`
- Forced-colors mode drops shadows entirely, so every overlay keeps a real border: that is why the hairline is not optional
