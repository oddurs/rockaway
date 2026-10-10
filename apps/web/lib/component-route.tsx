/**
 * A component's page, and its outline, given its example (cairn 0147). The
 * routes are written one per component by `scripts/routes.ts`, each importing
 * only its own example: a page whose route could import every example would
 * load every example's React Aria (a page's client chunks are everything its
 * module could reach).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Code } from '../components/Code.tsx';
import { Outline } from '../components/Outline.tsx';
import { ScrollRegion } from '../components/ScrollRegion.tsx';
import { PageBody } from '../components/shell/PageBody.tsx';
import { headHtml, restHtml, sectionsOf } from './component-page.ts';
import { components, slugOf } from './components.ts';

const metaOf = (slug: string) => {
  const meta = components.find((c) => slugOf(c.name) === slug);
  if (!meta) throw new Error(`no component's page is ${slug}`);
  return meta;
};

export function componentMetadata(slug: string): Metadata {
  const meta = metaOf(slug);
  return { title: meta.name, description: meta.summary.replaceAll('`', '') };
}

export function ComponentPage({
  slug,
  children,
}: {
  readonly slug: string;
  /** The live example. */
  readonly children: ReactNode;
}): ReactNode {
  const meta = metaOf(slug);
  const source = readFileSync(path.join(process.cwd(), 'examples', `${slug}.tsx`), 'utf8');
  return (
    <PageBody title={meta.name}>
      <article className="rk-prose">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: written at build from the package's metadata. */}
        <div className="site-html" dangerouslySetInnerHTML={{ __html: headHtml(meta) }} />
        <ScrollRegion label="Example">{children}</ScrollRegion>
        <Code code={source.replace(/^'use client';\n\n/, '')} lang="tsx" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: written at build from the package's metadata. */}
        <div className="site-html" dangerouslySetInnerHTML={{ __html: restHtml(meta) }} />
      </article>
    </PageBody>
  );
}

export function ComponentOutline({ slug }: { readonly slug: string }): ReactNode {
  return <Outline sections={sectionsOf(metaOf(slug))} />;
}
