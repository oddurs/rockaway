/**
 * Each page's social card (cairn 0150): its title in a frame, drawn by the
 * engine and painted to PNG at build time. See `src/lib/card.ts`.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { cardPng } from '../../lib/card.ts';
import { allPages, cardPath, type Page } from '../../lib/pages.ts';

export const getStaticPaths: GetStaticPaths = async () =>
  (await allPages()).map((page) => ({
    params: {
      card: cardPath(page.path)
        .replace(/^cards\//, '')
        .replace(/\.png$/, ''),
    },
    props: { page },
  }));

export const GET: APIRoute = async ({ props, site }) => {
  const { page } = props as { page: Page };
  const where = new URL(import.meta.env.BASE_URL, site ?? 'https://oddurs.github.io');
  const png = await cardPng(page, `${where.host}${where.pathname.replace(/\/$/, '')}`);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
