/**
 * The sitemap (cairn 0150): every page, as the map lists them.
 */
import type { APIRoute } from 'astro';
import { escapeHtml } from '../lib/html.ts';
import { allPages } from '../lib/pages.ts';
import { href } from '../lib/paths.ts';

export const GET: APIRoute = async ({ site }) => {
  const pages = (await allPages()).filter((page) => !page.path.endsWith('.html'));
  const urls = pages
    .map((page) => `  <url><loc>${escapeHtml(new URL(href(page.path), site).href)}</loc></url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
