---
---

Wait for the selection boxes to be painted before the Selection story reads them: they are painted from `selectionchange`, a task after the selection is made, and two frames was not enough on a Linux runner in the p3 project.
