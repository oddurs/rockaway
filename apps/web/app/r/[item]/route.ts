/**
 * The copy-in registry (cairn 0046), in shadcn's format: the index at
 * `/r/registry.json`, and each item at `/r/<name>.json`, which
 * `npx shadcn add <site>/r/<name>.json` copies in.
 */

import { absolute } from '../../../lib/paths.ts';
import { registryIndex, registryItem } from '../../../lib/registry.ts';
import { entries, json } from '../../../lib/registry-site.ts';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { item: string }[] {
  return [{ item: 'registry.json' }, ...entries.map(({ item }) => ({ item: `${item.name}.json` }))];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ item: string }> },
): Promise<Response> {
  const { item } = await params;
  if (item === 'registry.json') return json(registryIndex(absolute(''), entries));
  const entry = entries.find((e) => `${e.item.name}.json` === item);
  if (!entry) return new Response('Not found', { status: 404 });
  return json(registryItem(entry.item, entry.files));
}
