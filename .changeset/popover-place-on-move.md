---
'@rockaway/react': patch
---

An open popover is placed again when its trigger moves without changing size. That happens when the screen the trigger is in remeasures its cell: a density switched while the popover is open, or a sheet giving way to a popover. Before, React Aria kept the popover where the trigger had been, and snapping it to the grid only found the nearest wrong row.
