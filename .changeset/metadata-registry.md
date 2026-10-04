---
---

No package changes. The component metadata's registry is now generated from the `*.meta.ts` files by `pnpm --filter @rockaway/react metadata`, written to `packages/react/src/metadata/components.ts`. Each component's test fixture and its snapshots now sit beside it, in `<name>.fixture.ts` and `<name>.snapshots.txt`. So two components added at once no longer both edit `metadata/index.ts` and `test/metadata.test.ts`. The published `meta.json` is byte-identical.
