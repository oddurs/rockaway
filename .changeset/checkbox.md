---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Checkbox` and `CheckboxGroup`. A checkbox is one row of text, `[✓] Sign commits`: the control's delimiters around a mark cell that holds the theme's check, its dash when indeterminate, or a blank, then a cell of air, the words, and the cell a required mark takes. The whole row toggles on press. Hover underlines the words, pressed reverses the box, focus rings the row, disabled dims, read-only drops the delimiters and invalid colours them, with the error under the row; no state moves a cell. A `CheckboxGroup` is a `Fieldset` inside React Aria's `CheckboxGroup`, its label set into the frame's top edge and its required mark there, once. `checkboxBuffer` draws a row as text.

`checkField` now checks the required mark a control that carries its own words draws after them, and leaves a field inside a group to the group's legend.
