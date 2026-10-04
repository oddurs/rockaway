/**
 * The favicon as a PNG, for what cannot read an SVG one, and for a phone's
 * home screen (cairn 0150).
 */
import type { APIRoute } from 'astro';
import { faviconPng } from '../lib/card.ts';

export const GET: APIRoute = async () =>
  new Response(await faviconPng(180), { headers: { 'Content-Type': 'image/png' } });
