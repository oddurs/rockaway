/**
 * The foundations (cairn 0106): what every component stands on, in the order
 * to read it. Plain links, which the shell follows through the router and
 * fetches when pointed at: `next/link` would add its script to the page.
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageBody } from '../../components/shell/PageBody.tsx';
import { FOUNDATION_PAGES } from '../../lib/foundations-pages.ts';
import { BASE } from '../../lib/paths.ts';

export const metadata: Metadata = {
  title: 'Foundations',
  description:
    'What every component stands on: the grid, strictness, glyphs, colour, themes, tokens and accessibility, each drawn by the system it describes.',
};

export default function Foundations(): ReactNode {
  return (
    <PageBody title="foundations">
      <article className="rk-prose" data-rk-reading="" data-rk-conformance="loose">
        <h1>Foundations</h1>
        <p>
          What every component stands on. Each page is drawn by the system it describes: the frames
          are the engine&rsquo;s, painted by the cell, and the tables are read from the tokens when
          the site is built.
        </p>
        <ol>
          {FOUNDATION_PAGES.map((p) => (
            <li key={p.id}>
              <a href={`${BASE}/foundations/${p.id}/`}>{p.title}</a>. {p.description}
            </li>
          ))}
        </ol>
      </article>
    </PageBody>
  );
}
