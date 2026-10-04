---
'@rockaway/css': patch
---

`import '@rockaway/css'` type-checks in a TypeScript app that checks side-effect imports (cairn 0107).

Vite's React template turns on `noUncheckedSideEffectImports`, and a bare package name matches no `*.css` declaration. A fresh Vite app following the getting-started guide failed `tsc` on its first line. The package's entry now carries a `types` condition, `src/index.d.css.ts`, which declares that there is nothing to import.
