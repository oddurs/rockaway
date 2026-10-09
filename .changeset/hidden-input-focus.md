---
'@rockaway/css': minor
'@rockaway/react': patch
---

One rule draws the focus ring for a control whose focus is on a visually hidden input, a switch, a checkbox or a radio: on the label React Aria wraps round the input and marks `data-focus-visible`. A component no longer declares the ring for itself.

Checkbox no longer declares the ring itself, so its metadata no longer lists the focus tokens among those it reads: focus.css draws its ring.
