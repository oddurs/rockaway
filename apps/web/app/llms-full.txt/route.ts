/**
 * `llms-full.txt` (cairn 0048): every document and every component's twin in
 * one file, for an agent that reads the whole system at once.
 */
import { llmsFull } from '../../lib/llms.ts';
import { site, text } from '../../lib/llms-site.ts';

export const dynamic = 'force-static';

export function GET(): Response {
  return text(llmsFull(site()));
}
