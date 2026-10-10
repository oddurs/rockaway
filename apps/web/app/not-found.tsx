/**
 * The page for an address with no page (cairn 0150): a screen, in the shell,
 * like every other, with the map beside it and a way home under it. The
 * export writes it as `404.html`, which GitHub Pages serves for any address
 * it has no file for.
 */
import { Attr, Buffer, drawBox, drawText, rect } from '@rockaway/grid';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageBody } from '../components/shell/PageBody.tsx';
import { pageMetadata } from '../lib/pages.ts';
import { screenHtml } from '../lib/painted.ts';
import { asset } from '../lib/paths.ts';

export const metadata: Metadata = pageMetadata('404.html');

// As wide as the page has room for on the narrowest phone, 320 pixels.
const COLS = 26;
const ROWS = 5;
const screen = screenHtml(
  Buffer.create({ width: COLS, height: ROWS }).draw((draft) => {
    drawBox(draft, rect(0, 0, COLS, ROWS), { title: '404', titleStyle: { attrs: Attr.bold } });
    drawText(draft, { x: 2, y: 1 }, 'No page here.');
    drawText(draft, { x: 2, y: 3 }, 'g h  home    ?  keys', {
      style: { fg: 'fg.muted', attrs: Attr.none },
    });
  }),
  { 'aria-hidden': 'true' },
);

export default function NotFound(): ReactNode {
  return (
    <PageBody title="not found">
      <article className="rk-prose">
        <h1>Not here</h1>
        <figure
          aria-label="404: no page at this address."
          // biome-ignore lint/security/noDangerouslySetInnerHtml: drawn by the engine at build.
          dangerouslySetInnerHTML={{ __html: screen }}
        />
        <p>
          There is no page at this address. Go <a href={asset('')}>home</a>, see{' '}
          <a href={asset('components/')}>every component</a>, or take a page from the map: every
          page of the site is there.
        </p>
      </article>
    </PageBody>
  );
}
