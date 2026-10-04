/**
 * `llms-full.txt` (cairn 0048): every document and every component's twin in
 * one file, for an agent that reads the whole system at once.
 */
import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/llms.ts';
import { site, text } from '../lib/llms-site.ts';

export const GET: APIRoute = async () => text(llmsFull(await site()));
