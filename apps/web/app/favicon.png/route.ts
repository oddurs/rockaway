/**
 * The favicon as a PNG, for what cannot read an SVG one, and for a phone's
 * home screen (cairn 0150).
 */
import { faviconPng } from '../../lib/card.ts';

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  return new Response(await faviconPng(180), { headers: { 'content-type': 'image/png' } });
}
