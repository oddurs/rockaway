---
'@rockaway/css': minor
---

Set prose on the grid with `.rk-prose` (cairn 0143).

- `prose.css`, in a new `rk.prose` cascade layer between `rk.base` and `rk.components`: headings in one size, with h1 and h2 over a double and a single rule; lists with native markers in whole cells; a quote gutter; code blocks and tables that scroll in their own box rather than leave the grid; and a measure of eighty cells, rounded down to whole cells when the box is narrower.
- The rules, the gutter and `hr` are drawn by the cell: `shapes.css` gives them the same strokes as `═`, `─` and `│`.
- A table's columns can be sized in whole cells by a Markdown pipeline (`<col style="--rk-cols: N">`), so its cells wrap inside them instead of the browser squeezing the table to fractions of a cell.
- `h1` is no longer letter-spaced in `base.css`: tracking made every character wider than its cell.
