---
"@rockaway/css": patch
---

A region that scrolls across (`rk-scroll-marks`, and prose `pre`) is never narrower than itself: its one column is `minmax(max-content, auto)`, which stretches to the region, not `max-content`. A screen the page sizes, such as a Fieldset, has no width of its own, and wrapped in one it measured itself a single cell wide.
