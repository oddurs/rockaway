---
'@rockaway/react': minor
---

`Pane` takes `landmark`, true by default. `landmark={false}` makes a titled pane a plain container with no name rather than a region, its title still drawn in its top edge: for a pane that frames a landmark of its own, a named `nav`, `main` or `aside`, which then stays at the top of a reader's list of landmarks. An empty `label` now gives a plain container as well, since it names nothing.
