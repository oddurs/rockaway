/**
 * The component metadata (cairn 0047), served as the package builds it, so
 * `llms.txt` can point an agent at the data its twins are drawn from.
 */
import type { APIRoute } from 'astro';
import { metadata, text } from '../lib/llms-site.ts';

export const GET: APIRoute = () =>
  text(`${JSON.stringify(metadata, null, 2)}\n`, 'application/json');
