---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `ComboBox` and `ComboBoxItem`: type to filter a list too long to scan, and choose one value from what is left. It is a field: the label in the label column, and a box exactly `cols` cells wide in the control column. The box is a text field's: the text between the control delimiters, a cell either side for the overflow marks, then the open mark and the closing delimiter. Those last three cells are the button that opens every option.

- The popover opens under the box, with List's rows.
- Where the typed text matches a row, those characters are underlined, bold and in the accent. When nothing matches, a muted row says so (`empty`).
- Filtering ignores case and accents.
- The arrows move the cursor while focus stays in the box, and the number of options is announced as it changes.
- `comboBoxBuffer`, `comboBoxBoxBuffer`, `matchRange` and `matchingOptions` draw it and filter it as text.

An overlay now also watches the size of what it holds, so content that shrinks inside a body held at `maxRows` no longer leaves a scroll thumb in its edge.
