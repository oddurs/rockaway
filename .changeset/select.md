---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Select` and `SelectItem`: one value from a list too long for radios. A field, its label in the label column and its trigger in the control column exactly `cols` cells wide: the value between the control delimiters, a cell of air either side and the open mark before the closing one, cut with the theme's ellipsis and read whole by a screen reader. The popover opens on the row under the trigger, its rows starting in the value's column, and its rows are List's: the cursor mark, the selected row in reverse video with the check. Hover underlines the value, a press reverses it, invalid draws the delimiters in danger with the error under the field, disabled dims and a placeholder is muted; no state changes a cell. Built on React Aria's `Select`: type-ahead with it closed, and a hidden native select for forms and autofill. `selectBuffer` and `selectTriggerBuffer` draw it as text. The state vocabulary's placeholder row now names React Aria's `[data-placeholder]` beside `:placeholder-shown`.
