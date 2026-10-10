/**
 * The component metadata (cairn 0047), served as the package builds it, so
 * `llms.txt` can point an agent at the data its twins are drawn from.
 */
import { metadata, text } from '../../lib/llms-site.ts';

export const dynamic = 'force-static';

export function GET(): Response {
  return text(`${JSON.stringify(metadata, null, 2)}\n`, 'application/json');
}
