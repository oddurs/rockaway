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
- **Keyboard first, touch second, mouse third.** All three work, in that order of certainty.
- **The browser floor is Baseline 2024.** Newer CSS goes behind `@supports` with a working fallback.

## Adding a component

A component adds one line to each barrel and touches no other line:

- `packages/react/src/index.ts`: one `export { … } from './components/<name>.tsx';`
  naming the component's public values and types, on one line. Names are listed
  rather than `export *`, so anything the file exports only for its tests or
  metadata stays out of the public API.
- `packages/css/src/index.css`: one `@import "./components/<name>.css";` among
  the component imports, in path order.
- Every component file needs `'use client'` as its first line if it uses a hook
  or an event handler. CI fails the packed build without it.

Both barrels merge with `merge=union` (see `.gitattributes`), so two branches
that each added a line rebase without a conflict. The joined lines can come out
of order: `pnpm format` sorts the TypeScript barrel, and the barrel test fails
until the CSS imports are back in path order. Union cannot judge, though: if
two branches changed the *same* line, say both added a name to Button's export,
the merge keeps both versions. `pnpm --filter @rockaway/react test` then fails
with the component listed twice. Delete the stale line, keep the one with every
name, and run `pnpm format`.

## Changesets

Any change to a published package needs a changeset:

```sh
pnpm changeset
```

Semver is strict. A changed semantic token is a minor release; a removed or
renamed one is major.

## Commits and pull requests

Small, focused pull requests. Reference the cairn item they close (`Closes cairn 0062`).
CI must be green.
