# Contributing to rockaway

## Setup

Node 24 (see `.nvmrc`) and pnpm 12.

```sh
pnpm install
pnpm --filter workbench exec playwright install chromium   # once, for story tests
pnpm check
```

`pnpm check` is what CI runs: Biome, TypeScript, the package builds, every
story as a browser test with axe, and the roadmap.

## Where work comes from

The roadmap and backlog are Markdown files in [`cairn/items`](cairn/items),
managed with [cairn](https://github.com/oddurs/cairn). Do not add TODO or
PLAN files; add an item.

```sh
cairn next                 # what is ready, ranked
cairn claim <id>           # take it before you start
cairn show <id> --criteria # the acceptance criteria, numbered
cairn tick <id> <n>        # as each one becomes true
cairn close <id>
cairn check                # must pass
```

Never edit `ROADMAP.md` by hand; it is rendered from the items.

Architecture choices are `decision` items. If a change contradicts one, change
the decision first, in its own pull request, with the reasoning.

## The rules that keep the system coherent

- **Everything is whole cells.** A box that measures 37.5px is a bug the conformance test catches. If you mean to break the grid, say so with `data-rk-offgrid="reason"` — the test prints every exception and its reason.
- **Never draw box characters by hand.** Ask the engine for a frame; the junction model owns every seam.
- **Frame glyphs are `aria-hidden`.** A screen reader hears a button, never `┌────┐`.
- **Semantic tokens only.** Component CSS reads `var(--rk-*)` semantic tokens. Needing a reference value means a semantic token is missing; add it.
- **Style from state.** Component CSS keys off class names and the `data-*` attributes React Aria emits. It never depends on a React API.
- **Stay in the layers.** All CSS lives inside `@layer rk.*`.
- **Every state has a story, and every component has a text snapshot.** Stories are the tests; the snapshot is documentation that cannot drift.
- **Let the page settle before you point at it.** A play function that hovers, presses with the pointer or compares geometry starts with `await settled()` from `apps/workbench/src/settled.ts`. Without it, the font and the screen's re-measure move the layout under the test in CI, and Chromium's own pointer events end a hover the moment it starts (cairn 0164).
- **Keyboard first, touch second, mouse third.** All three work, in that order of certainty.
- **The browser floor is Baseline 2024.** Newer CSS goes behind `@supports` with a working fallback.

## Adding a component

A component adds one file, and one line to each barrel, and touches no other line:

- `packages/react/src/entries/<name>.ts`: `export { … } from '../components/<name>.tsx';`,
  naming the component's public values and types. This is `@rockaway/react/<name>`,
  the entry an islands site hydrates the component from, and the one list of
  what the component makes public: anything else the component file exports
  for its tests or metadata stays private. The build, the exports map and the
  package check all find it without being told.
- `packages/react/src/index.ts`: one `export * from './entries/<name>.ts';`.
- `packages/css/src/index.css`: one `@import "./components/<name>.css";` among
  the component imports, in path order.
- Every component file needs `'use client'` as its first line if it uses a hook
  or an event handler. CI fails the packed build without it.
- `packages/react/src/components/<name>.meta.ts`: its metadata (cairn 0047),
  added to the list in `src/metadata/index.ts`. Then run
  `pnpm --filter @rockaway/react metadata` to read its props and tokens.
  `test/metadata.test.ts` fails for a component exported without metadata, and
  for metadata that names a part, variant or state the component does not have.

Both barrels merge with `merge=union` (see `.gitattributes`), so two branches
that each added a line rebase without a conflict. The joined lines can come out
of order: `pnpm format` sorts the TypeScript barrel, and the barrel test fails
until the CSS imports are back in path order. Union cannot judge, though: if
two branches changed the *same* line, the merge keeps both versions, and
`pnpm --filter @rockaway/react test` fails with the component listed twice.
Delete the stale line and run `pnpm format`. A component's public names live
in its entry, not in the barrel, so adding one never touches a shared line.

## Changesets

A change to what a published package ships (its `src`, or anything else in its
`files`) needs a changeset. Tests, stories, scripts and the workbench do not. CI
fails a pull request that changes a package without naming it in a changeset,
and `pnpm changeset:check` runs the same check locally.

```sh
pnpm changeset
```

Write it for the person upgrading: what they can now do, or what they have to
change, in a paragraph, starting with a verb. The changesets already in
`.changeset/` are the voice to match.

If a change ships but no user could notice it (a comment, a rename inside a
module, a refactor with identical output), say so instead of skipping the step:

```sh
pnpm changeset --empty   # then write the reason in its body
```

An empty changeset with no reason in it does not pass.

Semver is strict:

- **Major**: something a user relies on is removed or renamed, or behaves
  differently with the same input. That covers an export, a prop, a token, a
  CSS class or `data-*` attribute a stylesheet can select, an export path, or a
  default. A removed or renamed semantic token is major.
- **Minor**: something is added and nothing existing changes, such as a
  component, a prop, an export, a token or a theme. A changed semantic token
  value is minor.
- **Patch**: a fix that makes the package do what it already said it did.

## Commits and pull requests

Small, focused pull requests. Reference the cairn item they close (`Closes cairn 0062`).
CI must be green.
