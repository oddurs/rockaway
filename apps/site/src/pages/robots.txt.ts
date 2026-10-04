/**
 * robots.txt (cairn 0150): everything may be read, and here is the map.
 */
import type { APIRoute } from 'astro';
import { href } from '../lib/paths.ts';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(href('sitemap.xml'), site).href}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
