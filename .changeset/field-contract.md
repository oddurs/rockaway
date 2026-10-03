---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add the field contract: `Label`, `Description`, `FieldError`, `Form`, `Fieldset` and `FieldFrame`, the parts every field is built from, and `fieldClass()` for a field's React Aria root. A field is two columns of cells: the label, bold, with a cell kept after it for the required mark so required never moves the control; the control; the description, dim, under it; and the error under that, the theme's cross then the message in `fg.danger`. A `Form` lines its fields up in one column of controls after its longest label, or a `labelWidth` in cells, and stacks each label over its control under 60 cells. A framed control sets its label into its frame's top edge with `FieldFrame`, and `Fieldset` is a framed group named by its legend that, inside a React Aria checkbox or radio group, becomes that group's frame and draws its invalid and disabled states. React Aria supplies the semantics: the description and the error are linked by `aria-describedby`, and validation is native unless the form says otherwise. `formBuffer` and `fieldFrameBuffer` draw a form and a field frame as text.
