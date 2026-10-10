/**
 * Write a route per component (cairn 0147): `app/components/(each)/<name>/`
 * and its outline. Each imports only its own example, so each page loads
 * only its own example's script. Every component the metadata describes
 * gets one; one without an example fails here, before the build.
 *
 * The routes are build output, not source: they are ignored by git and
 * written again before every build and every dev server.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const meta = require('@rockaway/react/meta.json') as { components: { name: string }[] };
const app = path.join(import.meta.dirname, '..', 'app');
const slugOf = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const pages = path.join(app, 'components', '(each)');
const outlines = path.join(app, '@outline', 'components', '(each)');
rmSync(pages, { recursive: true, force: true });
rmSync(outlines, { recursive: true, force: true });

const header =
  '// Written by scripts/routes.ts. Do not edit: it is written again before every build.\n';
for (const { name } of meta.components) {
  const slug = slugOf(name);
  if (!existsSync(path.join(import.meta.dirname, '..', 'examples', `${slug}.tsx`))) {
    throw new Error(`${name} has no example: add apps/web/examples/${slug}.tsx`);
  }
  mkdirSync(path.join(pages, slug), { recursive: true });
  // The example's module, loaded only when the example nears the view: its
  // own client file, so the import is the client's to make, not the page's.
  writeFileSync(
    path.join(pages, slug, 'example.tsx'),
    `'use client';

${header}import { deferred } from '../../../../components/Deferred.tsx';

export const Example = deferred(() =>
  import('../../../../examples/${slug}.tsx').then((module) => module.Example),
);
`,
  );
  writeFileSync(
    path.join(pages, slug, 'page.tsx'),
    `${header}import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ComponentPage, componentMetadata } from '../../../../lib/component-route.tsx';
import { Example } from './example.tsx';

export const metadata: Metadata = componentMetadata('${slug}');

export default function Page(): ReactNode {
  return (
    <ComponentPage slug="${slug}">
      <Example />
    </ComponentPage>
  );
}
`,
  );
  mkdirSync(path.join(outlines, slug), { recursive: true });
  writeFileSync(
    path.join(outlines, slug, 'page.tsx'),
    `${header}import type { ReactNode } from 'react';
import { ComponentOutline } from '../../../../../lib/component-route.tsx';

export default function Page(): ReactNode {
  return <ComponentOutline slug="${slug}" />;
}
`,
  );
}
