---
'@rockaway/css': patch
---

A form exactly sixty cells wide keeps its label column in every engine. The form's stacking query now asks at the midpoint, `width < 59.5ch`, rather than at `60ch`: layout snaps every box to 1/64px while the cell is the font's true advance, so a form laid out sixty cells wide could measure a hair under `60ch`, and WebKit stacked it. No width between 59 and 60 cells ever happens, so the midpoint asks "fewer than sixty whole cells" exactly.
