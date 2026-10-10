---
"@rockaway/grid": minor
"@rockaway/css": minor
"@rockaway/react": minor
---

Lay out on one grid in three tiers (0311): structure on whole cells, rhythm on half-steps, and seams that close a rhythm block back onto whole cells.

- `@rockaway/grid` counts rhythm in half-steps: `rhythm` for each comfort (`compact`, `comfortable`, `spacious`), `flow` to lay blocks down with a gap and seam them to whole rows, `seamRows` and `fieldSteps`.
- `@rockaway/css` adds `--rk-step-x` and `--rk-step-y`, the `--rk-rhythm-*` counts under `data-rk-comfort` (comfortable by default), and the `.rk-flow` and `.rk-seam` utilities. A seam is CSS alone where `calc-size` is supported.
- `@rockaway/react` adds `Flow` and `useSeam`, which closes a seam with a min-height where CSS cannot. `checkConformance` allows half-steps inside a rhythm block (`data-rk-rhythm`) at `standard`, holds every seam to whole cells at every level, and lists every box that bends in a new `rhythm` audit on the report.
