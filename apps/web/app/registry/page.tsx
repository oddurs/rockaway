/**
 * The copy-in registry (cairn 0046): every item, drawn by its own code, with
 * the line that copies it in. Each item sits outside the prose, as it would in
 * an app, and is hydrated as it nears the view, so what is drawn here is what
 * a reader gets.
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { RegistryItem } from '../../components/RegistryLive.tsx';
import { ScrollRegion } from '../../components/ScrollRegion.tsx';
import { PageBody } from '../../components/shell/PageBody.tsx';
import { pageMetadata } from '../../lib/pages.ts';
import { asset } from '../../lib/paths.ts';
import { entries, installLine } from '../../lib/registry-site.ts';

export const metadata: Metadata = pageMetadata('registry/');

export default function Registry(): ReactNode {
  return (
    <PageBody title="registry">
      <article className="rk-prose">
        <h1>Registry</h1>
        <p>
          Components are a package, because two apps disagreeing about a button is a bug.
          Compositions are copied in, because two apps disagreeing about an empty state is the
          point. Each item here imports only from the packages and never from another item, so
          copying one never brings another. They are in shadcn&apos;s format, so its CLI copies them
          in; the index is{' '}
          <a href={asset('r/registry.json')}>
            <code>r/registry.json</code>
          </a>
          .
        </p>
      </article>
      {entries.map(({ item, files }) => (
        <section key={item.name} data-registry-item={item.name} aria-labelledby={item.name}>
          <article className="rk-prose">
            <h2 id={item.name}>{item.title}</h2>
            <p>{item.description}</p>
            <pre>
              <code>{installLine(item.name)}</code>
            </pre>
          </article>
          <ScrollRegion label={item.title}>
            <RegistryItem name={item.name} />
          </ScrollRegion>
          <article className="rk-prose">
            <p>
              {files.map((f, i) => (
                <span key={f.name}>
                  {i === 0 ? '' : ', '}
                  <code>{f.name}</code>
                </span>
              ))}
              , from{' '}
              <a href={asset(`r/${item.name}.json`)}>
                <code>r/{item.name}.json</code>
              </a>
            </p>
          </article>
        </section>
      ))}
    </PageBody>
  );
}
