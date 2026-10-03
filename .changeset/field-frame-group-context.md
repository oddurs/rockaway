---
'@rockaway/react': patch
---

`FieldFrame` (and so `Fieldset`) no longer takes the group props a React Aria `NumberField` or `DateField` hands to the group under it. A frame around a `DateInput` used to carry the field's `aria-labelledby` and press handling as well as the date input itself, so it was labelled twice; now the frame takes none of them and passes them on, unchanged, to the group it frames.
