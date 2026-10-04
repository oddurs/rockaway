/**
 * Writes `src/metadata/extracted.ts`: each component's props and tokens, read
 * from its source and its stylesheets (cairn 0047). And `src/metadata/components.ts`,
 * the registry of every `*.meta.ts`. Run it after changing a component's props
 * or its CSS, or adding one; `test/metadata.test.ts` fails until you do.
 *
 *   pnpm --filter @rockaway/react metadata
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { packageRoot, render, renderRegistry } from './extract.ts';

for (const [file, text] of [
  ['src/metadata/extracted.ts', render()],
  ['src/metadata/components.ts', renderRegistry()],
] as const) {
  const target = path.join(packageRoot, file);
  writeFileSync(target, text);
  console.log(`Wrote ${path.relative(process.cwd(), target)}`);
}
