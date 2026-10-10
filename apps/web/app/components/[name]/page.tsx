/**
 * A page per component (cairn 0147), generated from the metadata
 * `@rockaway/react` publishes: only the live example and its source are
 * written by hand, in `examples/<name>.tsx`.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { Code } from '../../../components/Code.tsx';
import { ScrollRegion } from '../../../components/ScrollRegion.tsx';
import { headHtml, restHtml } from '../../../lib/component-page.ts';
import { components, slugOf } from '../../../lib/components.ts';

export const dynamicParams = false;

export function generateStaticParams(): { name: string }[] {
  return components.map((c) => ({ name: slugOf(c.name) }));
}

const metaOf = (name: string) => components.find((c) => slugOf(c.name) === name);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const meta = metaOf((await params).name);
  return meta ? { title: meta.name, description: meta.summary.replaceAll('`', '') } : {};
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<ReactNode> {
  const { name } = await params;
  const meta = metaOf(name);
  if (!meta) notFound();
  // Each example is a chunk of its own, loaded by its page alone.
  const { Example } = (await import(`../../../examples/${name}.tsx`)) as { Example: ComponentType };
  const source = await readFile(path.join(process.cwd(), 'examples', `${name}.tsx`), 'utf8');
  return (
    <article className="rk-prose">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: written at build from the package's metadata. */}
      <div className="site-html" dangerouslySetInnerHTML={{ __html: headHtml(meta) }} />
      <ScrollRegion label="Example">
        <Example />
      </ScrollRegion>
      <Code code={source.replace(/^'use client';\n\n/, '')} lang="tsx" />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: written at build from the package's metadata. */}
      <div className="site-html" dangerouslySetInnerHTML={{ __html: restHtml(meta) }} />
    </article>
  );
}
