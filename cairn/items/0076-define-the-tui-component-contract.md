---
id: 76
title: Define the TUI component contract
type: decision
status: done
milestone: primitives
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: components
effort: m
---

## Context

Supersedes the component contract decision this item replaces (0031): the
parts of a component are no longer boxes and shadows, they are cells, frames
and attributes.

## Decision

Decided 2026-09-23.

- **A component declares its size in cells**, never in pixels, and asks the engine for its frame. It never draws box characters by hand.
- **Composition stays**: compound parts with slots, `render` for polymorphism, controlled and uncontrolled, `data-*` state as public API. That contract was right and is unchanged.
- **Frame characters are `aria-hidden`.** A screen reader hears a button, not `┌────┐`. The accessible name never contains a glyph.
- **Keyboard first, pointer supported.** Every component is operable with the keyboard alone, and every component works with a finger at `touch` density. Neither is optional.
- **Behaviour is still React Aria.** A TUI is keyboard-first, which is what React Aria is best at; nothing about the pivot changes 0008.
- **State is shown by attribute, not by colour alone**: selection is reverse, disabled is dim plus a `~` marker, error is a mark and a colour. Forced colors and colour blindness both get the same answer.
- **Every component ships a text snapshot**, which is its documentation as much as its test.

## Consequences

- The component inventory changes: `Frame`, `Divider`, `StatusBar`, `KeyHint` and `CommandPalette` join; radius and elevation props never existed
- A component that cannot be drawn on the grid is a component we do not ship
