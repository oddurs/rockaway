---
'@rockaway/react': minor
---

Every component has an entry of its own: `@rockaway/react/frame`, `@rockaway/react/button`, `@rockaway/react/key-hint` and so on, typed, each exporting the same names the package index exports for that component. An islands site (Astro, or anything that bundles each hydrated module as an entry) can hydrate one component without shipping the whole package. On the rockaway site, one `Frame` island costs 8.5 kB gzipped through `@rockaway/react/frame` against 46.5 kB through `@rockaway/react`. The index is unchanged.
