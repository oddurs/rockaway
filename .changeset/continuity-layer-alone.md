---
'@rockaway/react': patch
---

`checkContinuity` reads each painted layer alone: every other painted layer on the page is hidden for the moment of its screenshot, as the content laid over it already was. A letter's descender in one screen's title, which at dense reaches into the row below, is no longer charged as a leak to a screen that starts on that row, and two screens that overlap are each read without the other's lines.
