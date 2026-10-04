---
'@rockaway/react': patch
'@rockaway/css': patch
---

Place overlays on the same cells in every engine. A modal centred in an odd number of spare cells sits on a half cell exactly, and Chromium and Firefox measured it a hair either side, so it landed a column apart; a tie now goes up and left everywhere. A sheet in a viewport exactly a whole number of cells wide lost its last cell in Firefox, whose lengths are not multiples of the cell; it now takes a thirty-second of a pixel of slack, as `cellsIn` does.
