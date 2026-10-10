/**
 * The favicon (cairn 0150): two panes and the rule between them, drawn by the
 * engine. See `lib/card.ts`.
 */
import { faviconSvg } from '../../lib/card.ts';

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  return new Response(await faviconSvg(), { headers: { 'content-type': 'image/svg+xml' } });
}
