/**
 * The favicon (cairn 0150): two panes and the rule between them, drawn by the
 * engine. See `src/lib/card.ts`.
 */
import type { APIRoute } from 'astro';
import { faviconSvg } from '../lib/card.ts';

export const GET: APIRoute = async () =>
  new Response(await faviconSvg(), { headers: { 'Content-Type': 'image/svg+xml' } });
