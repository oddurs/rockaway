/**
 * Writes `src/metadata/extracted.ts`: each component's props and tokens, read
 * from its source and its stylesheets (cairn 0047). Run it after changing a
 * component's props or its CSS; `test/metadata.test.ts` fails until you do.
 *
 *   pnpm --filter @rockaway/react metadata
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { packageRoot, render } from './extract.ts';

const target = path.join(packageRoot, 'src/metadata/extracted.ts');
writeFileSync(target, render());
console.log(`Wrote ${path.relative(process.cwd(), target)}`);
