---
'@rockaway/react': patch
---

`checkTargets` now measures a checkbox, radio or switch by the label a pointer presses, not by the visually hidden native input inside it, which it reported as a 13px target nobody could hit. An input hidden that way with no label around it is no longer counted.
