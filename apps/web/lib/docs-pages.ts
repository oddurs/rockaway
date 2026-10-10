/**
 * The repository's documents as pages (cairn 0107): `docs/concept.md` is
 * `/concept/`. Server only: read and rendered at build.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { docs } from './docs.ts';
import { outline } from './outline.ts';
import { markdown } from './render.ts';

const root = path.join(process.cwd(), '..', '..', 'docs');

export const DOC_IDS: readonly string[] = Object.keys(docs);

/** A document as HTML, with its sections. */
export async function renderDoc(id: string) {
  const source = await readFile(path.join(root, `${id}.md`), 'utf8');
  return outline(await markdown(source));
}
