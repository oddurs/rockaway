/**
 * `llms.txt` (cairn 0048): what rockaway is, and a link to the Markdown twin
 * of every document and component. Generated from the metadata and `docs/`.
 */
import { llmsIndex } from '../../lib/llms.ts';
import { site, text } from '../../lib/llms-site.ts';

export const dynamic = 'force-static';

export function GET(): Response {
  return text(llmsIndex(site()));
}
