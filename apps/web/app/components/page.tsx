/** Every component, by name, with what it is. */
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { components, inline, slugOf } from '../../lib/components.ts';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every component in rockaway, with its snapshot, a live example and its keyboard.',
};

export default function Components(): ReactNode {
  return (
    <article className="rk-prose">
      <h1>Components</h1>
      <p>Every one is drawn on the grid, works without JavaScript, and takes a keyboard.</p>
      <ul>
        {components.map((c) => (
          <li key={c.name}>
            <Link href={`/components/${slugOf(c.name)}`}>{c.name}</Link>
            {': '}
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the package's own summary, with its code marked. */}
            <span dangerouslySetInnerHTML={{ __html: inline(c.summary) }} />
          </li>
        ))}
      </ul>
    </article>
  );
}
