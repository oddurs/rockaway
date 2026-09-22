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

- **Semantic tokens only.** Component CSS reads `var(--ds-*)` semantic tokens. Needing a reference value means a semantic token is missing; add it.
- **Style from state.** Component CSS keys off class names and the `data-*` attributes React Aria emits. It never depends on a React API.
- **Stay in the layers.** All CSS lives inside `@layer ds.*`.
- **Every state has a story.** Stories are the tests. A component without stories for each state is not done.
- **The browser floor is Baseline 2024.** Newer CSS goes behind `@supports` with a working fallback.

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
