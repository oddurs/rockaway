---
'@rockaway/react': minor
'@rockaway/grid': patch
'@rockaway/tokens': patch
---

The testing helpers — `checkConformance`, `expectConformance`, `formatReport` and `screenshot` — are exported from `@rockaway/react/testing` only. The main entry no longer re-exports them, so an app that imports a component no longer bundles test code; import them from `@rockaway/react/testing` instead.

`@rockaway/react/testing` and `@rockaway/react/paint` now resolve to their own builds rather than the main bundle and a file that was never emitted. Every JavaScript entry in `@rockaway/react`, `@rockaway/grid` and `@rockaway/tokens` carries a `types` condition, and each component module begins with `'use client'`, so components can be imported from a React Server Component.
