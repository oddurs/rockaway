/**
 * An island: one module per thing the site hydrates, and never a component
 * hydrated straight from `@rockaway/react` (cairn 0103).
 *
 * Astro builds each hydrated component's module as an entry point, and an
 * entry keeps every one of its exports. Hydrate `Frame` from the package's
 * index and the island ships the whole package, React Aria's list box and
 * all, for a box: 43 kB gzipped where this file costs 6. With one export
 * here, the bundler can drop the rest. For the same reason there is no index
 * in this directory: a shared one would be the package's barrel again.
 *
 * Compositions of the system's components live in this directory too. New
 * components never do: if the site needs one, the system grows it (0077).
 */
export { Frame } from '@rockaway/react';
