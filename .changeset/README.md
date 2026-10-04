# Changesets

Every change to what a published package ships (`@rockaway/grid`,
`@rockaway/tokens`, `@rockaway/css`, `@rockaway/react`) comes with a changeset:
`pnpm changeset`. CI checks it (`scripts/check-changeset.ts`, cairn 0162).

Below 1.0 (cairn 0172), a breaking change is a **minor** whose first line
begins `Breaking:`; CI refuses a major. A changed semantic token is a minor; a
removed or renamed one is breaking. See CONTRIBUTING.md for the rest.
