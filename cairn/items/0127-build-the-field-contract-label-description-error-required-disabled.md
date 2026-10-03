---
id: 127
uid: 42e4d9a8-b404-45ca-b14e-2ce12dfb25c0
title: 'Build the field contract: label, description, error, required, disabled'
type: feature
status: backlog
milestone: primitives
depends_on:
- 32
- 117
- 118
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: components
effort: m
---

## Problem

Text field, Checkbox, Switch, Radio group and Select (0035–0038, 0042) all
need a label, a description, an error, a required mark and a disabled state,
and a form needs its labels to line up. Written five times in parallel they
will be five layouts. React Aria supplies the semantics (`Label`,
`Text slot="description"`, `FieldError`, `validationBehavior`); what is ours is
where those parts sit on the grid.

## Proposal

Shared parts in `packages/react/src/field/`, used by every field component and
exported for custom fields:

- **Label**: bold, on the field's first row. Inline (start) for one-row
  controls; set into the top edge of the frame for framed controls, the way
  Frame sets its title: `┌ Name ─────────┐`.
- **Description**: dim, on the row below the control, wrapped in whole cells.
- **FieldError**: below the description, `✗` mark plus `fg.danger`. A message
  is content, so it may add rows (state vocabulary 0118).
- **Required**: `*` after the label, `aria-hidden`; the control carries
  `aria-required`.
- **Form**: a two-column grid in cells whose label column is as wide as its
  longest label (or a `labelWidth` in cells), so a form's controls line up the
  way a terminal form does. Stacks to one column under 60 cells.
- **Fieldset**: a framed group whose legend is set into the top edge, for
  checkbox and radio groups.

Validation is React Aria's `native` behaviour by default (errors on submit),
with `aria` available; server errors go through `Form`'s `validationErrors`.

## Acceptance criteria

- [ ] Label, Description, FieldError, Form and Fieldset exist, are exported, and are used by every field component that follows
- [ ] A Form of mixed fields lines its controls up in one column of cells, asserted by a text snapshot, and stacks under 60 cells
- [ ] Description and error are linked by `aria-describedby`; the error is announced on submit, once
- [ ] Required, disabled and invalid are drawn per 0118, and none changes the control's size in cells
- [ ] A Fieldset's legend is its group's accessible name, and the frame glyphs are not
- [ ] The recipe (0134) has a section on building a new field from these parts
