---
'@rockaway/react': minor
'@rockaway/css': minor
'@rockaway/tokens': minor
---

Add `ProgressBar`, `Meter`, `Sparkline` and `Spinner`, each one row of whole cells drawn by the cell renderer.

- **`ProgressBar`**: a task's progress in eighths of a cell. It shows the medium shade, with a block crossing it on the progress tick, when it is indeterminate.
- **`Meter`**: a level against `warning` and `danger` thresholds. The tone is shown as a colour and as a mark in its own cell.
- **`Sparkline`**: a series in braille dots or the theme's bars, newest at the right. A reader hears it summarised in words.
- **`Spinner`**: the theme's frames on the spinner tick, then its label, announced as a status.

All four are on React Aria where it has a part for them. None moves under reduced motion. No state is a colour alone, and no value changes a component's size.

The tokens gain `fill`, eight steps across a cell: `▏` to `█`, and `-`, `=`, `#` in ASCII. A bar's leading edge is drawn from it.
