---
'@rockaway/react': minor
---

Controls and panes now mark themselves for the conformance levels. Button, Link, Checkbox's row and TextField's box set `data-rk-control`, so a box inside one may sit on half a cell at `standard`. Frame, Callout, Fieldset, List, Tree, Table and the overlay surface set `data-rk-pane`, so they are held to whole cells even at `loose`. The component metadata gains `grid`, read from the code and the stories rather than written by hand. It holds what the levels see the component as, the strictest level a passing story holds it to, and its smallest and default size in cells. `meta.json` and its JSON Schema carry the new field.
