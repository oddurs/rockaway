---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `RadioGroup` and `Radio`: one choice out of a few, all in view. The group is a `Fieldset`, so its label is set into the frame's top edge, with the required mark after it, and the frame goes heavy when the group is invalid. A radio is its mark cell, a cell of air and its words: the theme's filled radio when chosen, in `fg.accent`, and its empty one when not, so the choice reads without colour. `orientation` is `vertical` (a radio on each row) or `horizontal` (two cells apart, wrapping whole radios to the next row). Pressing reverses the mark cell, invalid draws the marks in `fg.danger` with the error under the frame, read-only leaves the empty marks out and keeps their cells, and disabled dims; no state changes a cell. Built on React Aria's `RadioGroup`, `RadioField` and `RadioButton`, it is a field: it lines up in a `Form`'s control column and takes a `description` and an `errorMessage`. `radioBuffer` and `radioGroupBuffer` draw any state as text.
