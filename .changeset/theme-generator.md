---
'@rockaway/tokens': minor
---

Add the theme generator. `themes/default.json` holds the five theme inputs; `pnpm generate` writes DTCG 2025.10 files to `dtcg/`: palettes per mode, space and control sizes per density, font primitives, and `rockaway.resolver.json` tying them together. The files are exported as `@rockaway/tokens/dtcg/*`.
