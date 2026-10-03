---
id: 118
uid: 2ba64b83-5818-4777-adb2-9b11d1d79315
title: 'Fix the state vocabulary: how every state is drawn on the grid'
type: decision
status: backlog
milestone: primitives
depends_on:
- 76
- 91
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: css
effort: m
---

## Context

0076 said state is shown by attribute, not colour alone, and gave three
examples. Five components shipped since, and they already disagree: List draws
focus and selection identically (reverse video for both), so a multi-select
list cannot show which row the cursor is on; Button's danger variant claims a
mark in its source comment and carries only a colour; 0076's disabled `~`
marker was never built by anyone. Fifteen more components are about to be
written in parallel. Without one table they will invent fifteen dialects.

## Options

- **Per component, reviewed case by case.** What produced the drift above.
- **A table of states, each with one drawing, enforced by review and by the
  design pass.** Cheap, and it gives the parallel engineers one answer.

## Decision

The table. Proposed here by the program plan; whoever implements the first
polish ticket confirms it against real components and closes this.

**States never change geometry.** A state may change attributes, colour,
border weight or a glyph in a cell that is reserved in every state. It may
never add or remove a cell, because the grid forbids a control that moves its
neighbours when it is hovered. This is why 0076's `~` disabled marker is
withdrawn: it would cost a cell only when disabled.

| State | Source | Drawn as | Without colour |
| --- | --- | --- | --- |
| hover | `data-hovered` | underline on the label | underline |
| focus, unframed control | `data-focus-visible` | the focus ring (0061): an outline that costs no cell | outline |
| focus, framed control | `data-focus-visible` | the frame goes `heavy` in `border.focus` | weight |
| pressed | `data-pressed` | reverse video; a filled control reverses back | reverse |
| cursor (focused row in a collection) | `data-focused` | the cursor mark `▸` in the row's reserved mark cell | mark |
| selected | `data-selected` | reverse video; in multi-select also `✓` in a second reserved cell | reverse, mark |
| checked / indeterminate | `data-selected`, `data-indeterminate` | `✓` / `–` between the control's delimiters | mark |
| expanded / collapsed | `data-expanded` | `▾` / `▸` | mark |
| disabled | `data-disabled` | dim (`fg.disabled`), default cursor; forced colors maps to `GrayText` | dim is an attribute |
| invalid | `data-invalid` | `✗` mark before the message, `fg.danger`, framed controls go `heavy` in `border.danger` | mark, weight |
| required | `data-required` | `*` after the label, `aria-hidden` (the semantics are `aria-required`) | mark |
| read-only | `data-readonly` | the value without the control's track or ground | ground removed |
| current (navigation) | `aria-current` | bold plus the cursor mark | bold, mark |
| pending | `data-pending` | the spinner (0101) in a reserved cell | glyph |
| placeholder | `:placeholder-shown` | dim | dim |
| danger (a variant, not a state) | `data-variant="danger"` | `fg.danger` plus `!` in the reserved mark cell | mark |

Messages (an error under a field, a status line) are content, not states, and
may add rows.

## Consequences

Easy: every component item can quote a row of the table instead of a paragraph;
the design pass (0142) has something to check against; forced colors and
greyscale get the same answer everywhere.

Hard: reserving cells costs width. A checkbox, a list row and a menu item all
pay one cell for the mark whether or not it is drawn.

Revisit if a state appears that cannot be drawn without a cell of its own, or
if a screen reader pass (0157) shows a mark being announced.

When closed, `docs/concept.md` gains a short "States" section with this table,
and 0076 gets a note that its `~` marker is withdrawn.
