---
'@rockaway/react': minor
'@rockaway/css': minor
---

`List` is virtualised by row. Only the rows near the viewport are in the page, laid out by React Aria's `Virtualizer` and `ListLayout` at the measured cell height, so every row lands on a whole cell and the height follows the density. The keyboard still reaches the whole collection: Home, End, the page keys, and type-ahead to a row that was never rendered. The scrollbar counts the whole collection, not the rows in the page. Scrolling now snaps by proximity rather than mandatorily, so a jump far down the list is not pulled back to the rows already rendered, and `List` keeps its top row in place across a change of density.

In a test runner that sets `NODE_ENV=test` in a real browser (Vitest browser mode, Storybook's test runner), react-stately reads `process.env.VIRT_ON` at run time and the browser has no `process`. Define one in a setup file: `globalThis.process ??= { env: { VIRT_ON: '1' } }`. Under jsdom it renders every row, as it always has.

The component metadata gains an optional `knownIssues` list, for what is wrong outside a component's control and what to do about it. `List` records the `process` catch there.
