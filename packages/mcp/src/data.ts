/**
 * What the server answers from (cairn 0048): a snapshot of the system, taken
 * when the package is built and shipped inside it as `dist/data.json`.
 *
 *   - the component metadata `@rockaway/react` publishes (0047), `meta.json`
 *   - the DTCG token files and their resolver, as `@rockaway/tokens` ships them
 *   - the repository's `docs/`
 *
 * A snapshot rather than a dependency on the packages themselves: the server
 * then installs without React, and describes exactly the release it came
 * with. `scripts/data.ts` writes it; nothing here is written by hand.
 */
import { readFileSync } from 'node:fs';
import type { ComponentMeta } from '@rockaway/react/metadata';

/** A Markdown document from the repository's `docs/`. */
export interface Doc {
  /** Its path in the repository: `docs/concept.md`. */
  readonly path: string;
  readonly markdown: string;
}

export interface Data {
  /** The `@rockaway/react` version the metadata was read from. */
  readonly version: string;
  readonly components: readonly ComponentMeta[];
  /** Every DTCG file `@rockaway/tokens` ships, by file name, the resolver among them. */
  readonly tokens: Readonly<Record<string, unknown>>;
  /** Every token's CSS custom property, by its DTCG path. */
  readonly vars: Readonly<Record<string, string>>;
  readonly docs: readonly Doc[];
}

/** The snapshot the build wrote beside the server. */
export function loadData(file: URL = new URL('./data.json', import.meta.url)): Data {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Data;
  } catch (error) {
    throw new Error(
      `@rockaway/mcp cannot read its data at ${file.pathname}: build the package (pnpm build)`,
      { cause: error },
    );
  }
}
