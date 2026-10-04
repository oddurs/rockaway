# Changesets

Every change to what a published package ships (`@rockaway/grid`,
`@rockaway/tokens`, `@rockaway/css`, `@rockaway/react`, `@rockaway/mcp`) comes with a changeset:
`pnpm changeset`. CI checks it (`scripts/check-changeset.ts`, cairn 0162).

Semver is strict. A changed semantic token is a minor release; a removed or
renamed one is major. See cairn item 0011, and CONTRIBUTING.md for the rest.
