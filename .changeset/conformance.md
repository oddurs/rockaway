---
'@rockaway/react': minor
---

Add the conformance harness at `@rockaway/react/testing`: `checkConformance` measures every box inside a screen against the cell, `expectConformance` throws with the report, and anything carrying `data-rk-offgrid="reason"` is listed as a declared exception instead of a failure. A fixed-size `Screen` now sizes itself in cells.
