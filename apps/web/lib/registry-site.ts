/**
 * The registry's items as the build has them (cairn 0046): each item's files,
 * read as text from `registry/<name>/`, and where the site is served, for the
 * install line. Server only: it reads files.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { items } from '../registry/items.ts';
import { absolute } from './paths.ts';
import type { SourceFile } from './registry.ts';

const dir = path.join(process.cwd(), 'registry');

/** An item's files, its entry (`<name>.tsx`) first. */
export function filesOf(name: string): SourceFile[] {
  return readdirSync(path.join(dir, name))
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => ({ name: file, content: readFileSync(path.join(dir, name, file), 'utf8') }))
    .sort((a, b) => Number(b.name.startsWith(`${name}.`)) - Number(a.name.startsWith(`${name}.`)));
}

export const entries = items.map((item) => ({ item, files: filesOf(item.name) }));

/** What a reader runs to copy an item in. */
export const installLine = (name: string): string =>
  `npx shadcn@latest add ${absolute(`r/${name}.json`)}`;

export const json = (value: unknown): Response =>
  new Response(`${JSON.stringify(value, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
