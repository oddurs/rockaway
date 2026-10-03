---
id: 127
uid: 42e4d9a8-b404-45ca-b14e-2ce12dfb25c0
title: 'Build the field contract: label, description, error, required, disabled'
type: feature
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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
- [x] A Form of mixed fields lines its controls up in one column of cells, asserted by a text snapshot, and stacks under 60 cells
- [x] Description and error are linked by `aria-describedby`; the error is announced on submit, once
- [x] Required, disabled and invalid are drawn per 0118, and none changes the control's size in cells
- [x] A Fieldset's legend is its group's accessible name, and the frame glyphs are not
- [x] The recipe (0134) has a section on building a new field from these parts

## 2026-10-03

Claimed with --force past 0118: the CTO adopted 0118's table as the working answer for every wave (its 2026-10-03 note), and the brief calls it binding. Drawn here per that table.

## 2026-10-03

Built in packages/react/src/components/field.tsx (Label, Description, FieldError, Form, fieldClass, formBuffer) and fieldset.tsx (FieldFrame, Fieldset, fieldFrameBuffer), not src/field/ as proposed: the barrels (0122), the metadata extractor (0047) and the literal-glyph test all read src/components, and a part outside it would be invisible to all three. One stylesheet each, field.css and fieldset.css.

## 2026-10-03

Layout is CSS grid with named lines: a field is [label][control]; in a Form every .rk-field is a subgrid of the form's two columns, so the label column is max-content of every label in the form (or labelWidth cells) and every control starts in the same cell. Parts are placed by column only and auto-flow down in source order, so the order label, control, description, error is the layout. Stacking is a container query on the form's own width (container rk-form, width < 60ch). The grid is round(down, 100%, cell) wide so its columns are whole cells wherever the page puts it.

## 2026-10-03

Required: the label keeps one cell after it in every state and draws the theme's required mark there when isRequired is passed (React Aria puts required in no context a label can read, and a checkbox group's state stops being required once something is checked, so Label and Fieldset take isRequired explicitly from the render props). The mark is aria-hidden and coloured fg.danger from [data-required]. Disabled dims the label and mark but not the description: dimmed help text fails axe contrast and nothing marks it inactive.

## 2026-10-03

Framed labels: the engine draws the label into the top edge (fieldFrameBuffer, on frameBuffer's title), so truncation and future junction rules (0175) stay the engine's; a reader hears a visually hidden React Aria Label with the same words, taking the field's or group's ids from LabelContext. FieldFrame sits on React Aria's Group (role presentation), so data-invalid/data-disabled/data-focus-visible are React Aria's, not hand-set; the stylesheet colours the frame from them and the buffer draws the weight. Fieldset detects a surrounding React Aria group through LabelContext and then is not a group itself. 0175 not hit: nothing draws a junction into a field frame's top edge.

## 2026-10-03

Errors announced once: FieldError is never a live region. Native validation on submit focuses the first invalid control, whose aria-describedby then lists description and error, once each; the Errors on submit story asserts focus, the describedby ids and that the form holds no role=alert, aria-live or role=status. Structural proof only; a real screen-reader pass is 0157.

## 2026-10-03

Also in this PR: screenshot() now reads nested screens (a fieldset's chrome inside a frame) where they sit, and checkConformance() skips descendants of visually hidden boxes (RAC hides the native input of a checkbox or radio inside a clipped span, which the field family will all hit). The workbench gains react-aria-components as a dependency for the sketch fields in the Form and Fieldset stories.

## 2026-10-03

Criterion 6: the recipe (0134) does not exist yet, so the field section is in CONTRIBUTING.md under 'Building a field', marked as an interim home to move into docs/component-recipe.md; noted on 0134. Criterion 1 is left unticked: the parts exist and are exported, but 'used by every field component that follows' becomes true only as 0035-0038 and 0042 land.
