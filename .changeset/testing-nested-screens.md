---
'@rockaway/react': patch
---

`screenshot()` reads a screen inside a screen, such as a fieldset in a frame, where it sits: its chrome is written at its own position, over the outer chrome, instead of under the outer rows from the first column. `checkConformance()` leaves alone anything inside a visually hidden box, such as the native input a checkbox or a radio clips out of sight, as it already did the box itself.
