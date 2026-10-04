---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `TextField`, free text in a box exactly `cols` cells wide. `md` is one row between the control's delimiters, with the label beside it; `lg` is a frame with the label set into its top edge; `multiline` is that frame, `rows` tall, with a scrollbar drawn in a cell column. Text longer than the box scrolls inside it by whole cells and never grows the box, and the theme's overflow marks stand in the cells either side while text is hidden that way; no native scrollbar is drawn. Read-only shows the value alone, without the ground or the delimiters; disabled dims; invalid colours the delimiters, or makes a frame heavy, and shows the error under the box. Built on React Aria's `TextField`, `Input` and `TextArea` and the field contract, so it lines up in a `Form`. `textFieldBuffer` draws any box as text.

A heavy `FieldFrame` or `Fieldset` under an ASCII theme now keeps its `+-|` and draws them bold, since ASCII has no heavier line (decision 0183).
