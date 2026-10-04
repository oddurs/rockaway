/**
 * Every theme's terminal files (cairn 0106), served from what
 * `@rockaway/tokens` publishes under `terminal/`, so the site offers exactly
 * the files the package ships: `/terminal/kitty/rockaway-nord-dark.conf`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';

const root = path.join(
  path.dirname(createRequire(import.meta.url).resolve('@rockaway/tokens/package.json')),
  'terminal',
);

export const getStaticPaths: GetStaticPaths = () =>
  readdirSync(root).flatMap((format) =>
    readdirSync(path.join(root, format)).map((file) => ({ params: { format, file } })),
  );

const types: Record<string, string> = {
  '.itermcolors': 'application/xml',
  '.toml': 'application/toml',
};

export const GET: APIRoute = ({ params }) => {
  const file = path.join(root, params.format ?? '', params.file ?? '');
  return new Response(readFileSync(file), {
    headers: { 'content-type': types[path.extname(file)] ?? 'text/plain; charset=utf-8' },
  });
};
