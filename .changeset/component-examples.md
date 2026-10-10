---
---

Each component's example now lives beside it, as `<name>.example.tsx`, so the site's page and the workbench's kitchen sink can share one. Nothing published changes: examples are never built or packed, and `packages:check` refuses one in a tarball.
