/**
 * An example app (cairn 0151), on a page of its own: the registry item's own
 * code, filling the page. It is the same module `shadcn add` copies in, so the
 * page and the item cannot drift apart. It is drawn on the server and made
 * live as it nears the view, as every example on the site is.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { RegistryItem } from '../../../components/RegistryLive.tsx';
import { PageBody } from '../../../components/shell/PageBody.tsx';
import { pageMetadata } from '../../../lib/pages.ts';
import { href } from '../../../lib/paths.ts';
import { installLine } from '../../../lib/registry-site.ts';
import { items } from '../../../registry/items.ts';

export const dynamicParams = false;

const examples = items.filter((item) => item.example === true);

export function generateStaticParams(): { example: string }[] {
  return examples.map((item) => ({ example: item.name }));
}

function exampleOf(name: string) {
  const item = examples.find((e) => e.name === name);
  if (!item) notFound();
  return item;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ example: string }>;
}): Promise<Metadata> {
  return pageMetadata(`examples/${exampleOf((await params).example).name}/`);
}

export default async function Example({
  params,
}: {
  params: Promise<{ example: string }>;
}): Promise<ReactNode> {
  const item = exampleOf((await params).example);
  return (
    <PageBody title={item.title}>
      <article className="rk-prose">
        <h1>{item.title}</h1>
      </article>
      <div className="site-example" data-site-example={item.name}>
        <RegistryItem name={item.name} />
      </div>
      <article className="rk-prose">
        <p>
          {item.description} Copy it in with <code>{installLine(item.name)}</code>, or read it in
          the <a href={href(`registry/#${item.name}`)}>registry</a>.
        </p>
      </article>
    </PageBody>
  );
}
