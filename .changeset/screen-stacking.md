---
'@rockaway/css': patch
---

A screen is now a stacking context of its own, and so is a region with overflow marks (`rk-scroll-marks`, and code in prose). What a screen lifts over its own layers, such as an overflow mark or a callout's frame, stays inside it, so a modal's backdrop opened after it covers it. A CodeBlock's `›` used to show through an open dialog.
