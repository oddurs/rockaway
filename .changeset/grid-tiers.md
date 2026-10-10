---
"@rockaway/grid": minor
"@rockaway/css": minor
"@rockaway/react": minor
---

Lay out on one grid in three tiers (0311): structure on whole cells, rhythm on half-steps, and seams that close a rhythm block back onto whole cells.

- `@rockaway/grid` counts rhythm in half-steps: `rhythm` for each comfort (`compact`, `comfortable`, `spacious`), `flow` to lay blocks down with a gap and seam them to whole rows, `seamRows` and `fieldSteps`.
- `@rockaway/css` adds `--rk-step-x` and `--rk-step-y`, the `--rk-rhythm-*` counts under `data-rk-comfort` (comfortable by default), and the `.rk-flow` and `.rk-seam` utilities. A seam is CSS alone where `calc-size` is supported.
- `@rockaway/react` adds `Flow` and `useSeam`, which closes a seam with a min-height where CSS cannot. `checkConformance` allows half-steps inside a rhythm block (`data-rk-rhythm`) at `standard`, holds every seam to whole cells at every level, and lists every box that bends in a new `rhythm` audit on the report.

Forms are comfortable by default (0316). A `Form` puts each label over its control. A text box is padded half a row above and below, so one row of text sits in a two-row box. Help sits half a row under its control, and a field closes to whole rows. `comfort="compact"` keeps the terminal's form: two columns of cells, no padding, stacking under 60 cells. `formBuffer` takes the same `comfort`, and a field's `box: true` marks a padded text box. `screenshot()` places text by the middle of its line, so a line half a row down reads as the row below it at every density.
