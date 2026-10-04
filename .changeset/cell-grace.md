---
'@rockaway/react': minor
'@rockaway/css': patch
---

Count cells with a grace of a sixteenth of a cell, not 1/32px: layout rounds every box to the engine's unit and boxes laid end to end add their errors, so a fixed pixel grace is beaten by enough of them. `cellsIn` takes the new grace, `cellsCovering` is its dual for a surface at least as wide as something else, and `CELL_GRACE` is exported. An overlay as wide as its trigger now reads the trigger's cells with `cellsCovering`, so a trigger a few hundredths of a pixel over thirty cells gets thirty, not thirty-one.
