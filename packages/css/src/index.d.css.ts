/*
 * `@rockaway/css` is a stylesheet, imported for its effect: `import
 * '@rockaway/css'`. TypeScript checks that a side-effect import resolves
 * (`noUncheckedSideEffectImports`, on in Vite's React template), and a bare
 * package name matches no `*.css` declaration, so the import needs this to
 * type-check. There is nothing in it to import.
 */
export {};
