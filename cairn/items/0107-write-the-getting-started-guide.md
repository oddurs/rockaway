---
id: 107
uid: f5d795c4-6718-4dee-b191-f9e3ae015abf
title: Write the getting-started guide
type: docs
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 104
- 121
- 138
- 143
created: 2026-09-22
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: docs
effort: m
---

## Acceptance criteria

- [x] Install, import the CSS, render a screen, in under twenty lines
- [x] Says plainly what the system will not do: no arbitrary sizes, no radii, no emoji
- [x] The code on the page is the code the quickstart job (0155) extracts and runs from a clean install
- [x] Covers Vite and Next.js (app router, server components), and where the CSS import goes in each
- [x] Links to the recipe for anyone building their own component on the grid

## 2026-10-03

The pixel-era migration note is removed: nothing was ever published before the pivot, so nobody has anything to migrate from. 0051 was a duplicate of this item and is dropped in its favour.

## 2026-10-03

The guide is docs/getting-started.md. It is written once for GitHub and the site, where it renders at /getting-started/ through a new [doc].astro route that publishes every file in docs/. Links between docs stay on the site, under the base. Every code fence the reader copies carries quickstart and file attributes. apps/site/scripts/quickstart.ts extracts them from the guide and runs them the way a stranger would, from clean installs of the packed tarballs: create-vite 9.2.1 react-ts and create-next-app 16.3.8 with the app router and no Tailwind, then npm install, a production build, and a headless check that reads the screen back with screenshot() from the installed @rockaway/react/testing. The result is compared with the fence marked quickstart=screen. Vite and Next.js (app router, page.tsx as a server component) both pass and produce the same five-row screen. The Vite path is 17 lines counting the install, which test/quickstart.test.ts holds the guide to.

## 2026-10-03

Found by the quickstart: a fresh Vite app failed tsc on its first line, import '@rockaway/css'. Vite's react-ts template turns on noUncheckedSideEffectImports, and a bare package name matches no *.css declaration, so TypeScript reported the import as unresolved. This is a packaging bug, fixed in the package: @rockaway/css's entry gains a types condition, src/index.d.css.ts, which exports nothing. check-packages.ts learned that a stylesheet's declarations are named .d.css.ts, and that such a file is a declaration, not TypeScript source. The tokens import (@rockaway/tokens/tokens.css) was fine, because Vite's *.css ambient declaration matches it. There is a changeset.

## 2026-10-03

Criterion 3: the extraction and run that 0155 is to put in CI is scripts/quickstart.ts, and it passes for both apps against this branch. 0155 still owns the CI job (packing on every PR that touches packages/ or the guide). Criterion 5 stays unticked: there is no recipe to link to yet (0134). For now the guide points readers who want to build a component at the concept's ten rules (concept.md#the-contract-a-component-is-held-to), and says a recipe is being written. When 0134 lands, link docs/component-recipe.md from the guide's Next section and tick it.

## 2026-10-10

Criterion 5: the guide links the component recipe (0134) under Build your own component, where it said the recipe was being written.
