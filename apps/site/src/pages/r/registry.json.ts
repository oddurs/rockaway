/**
 * The registry's index (cairn 0046), `/r/registry.json`, in shadcn's
 * `registry.json` format: every item, with its files listed by path.
 */
import type { APIRoute } from 'astro';
import { registryIndex } from '../../lib/registry.ts';
import { absolute, entries, json } from '../../lib/registry-site.ts';

export const GET: APIRoute = () => json(registryIndex(absolute(''), entries));
