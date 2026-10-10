/**
 * Every page's social card (cairn 0150), `cards/components/tree.png`: the
 * page's title and description drawn as a screen, so a link to it in a chat
 * shows what it is. See `lib/card.ts`; the pages and their words are
 * `lib/pages.ts`.
 */
import { cardPng } from '../../../lib/card.ts';
import { allPages, cardPath, fullTitle } from '../../../lib/pages.ts';
import { asset, ORIGIN } from '../../../lib/paths.ts';

export const dynamic = 'force-static';
export const dynamicParams = false;

/** `cards/foundations/grid.png` as the segments the route takes. */
const segments = (path: string): string[] => cardPath(path).split('/').slice(1);

export function generateStaticParams(): { card: string[] }[] {
  return allPages().map((page) => ({ card: segments(page.path) }));
}

/** Where the site lives, as the card's bottom edge says it: `oddurs.github.io/rockaway`. */
const where = `${ORIGIN.replace(/^https?:\/\//, '')}${asset('')}`.replace(/\/$/, '');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ card: string[] }> },
): Promise<Response> {
  const { card } = await params;
  const page = allPages().find((p) => segments(p.path).join('/') === card.join('/'));
  if (!page) return new Response('Not found', { status: 404 });
  const png = await cardPng({ title: fullTitle(page), description: page.description }, where);
  return new Response(png, { headers: { 'content-type': 'image/png' } });
}
