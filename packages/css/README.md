# @rockaway/css

The CSS contract every consumer shares. Import it once, first:

```css
@import '@rockaway/css';
```

`src/shapes.css` is generated: it draws box drawing and block elements from the
geometry in `@rockaway/grid` (cairn 0117). Change the geometry, then run
`pnpm --filter @rockaway/css generate`; a test fails if the committed file is
stale.
