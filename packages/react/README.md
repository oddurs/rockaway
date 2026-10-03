# @rockaway/react

React primitives built on React Aria Components (cairn 0008). Styling comes
from `@rockaway/css`; components only apply class names and data attributes.

## Metadata

Every component describes itself as data (cairn 0047): what it is for, when
not to use it, its parts, variants, states, keyboard map, props, tokens and
text snapshots. Read it as typed JavaScript or as JSON:

```ts
import { components } from '@rockaway/react/metadata';
import metadata from '@rockaway/react/meta.json' with { type: 'json' };
```

`meta.json` validates against `@rockaway/react/meta.schema.json`. Inside a
React Server Component graph, use the JSON: the component modules the
JavaScript entry reads from are client modules there.

A component's metadata lives beside it in `src/components/<name>.meta.ts`.
Its props and tokens are read from its source and stylesheets into
`src/metadata/extracted.ts`; after changing either, run
`pnpm --filter @rockaway/react metadata`. `test/metadata.test.ts` fails until
you do, and fails when a component is exported without metadata or its
metadata names a part, variant or state the component does not have.
