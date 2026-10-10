/**
 * Every theme's terminal files (cairn 0106), served from what
 * `@rockaway/tokens` publishes under `terminal/`, so the site offers exactly
 * the files the package ships: `/terminal/kitty/rockaway-nord-dark.conf`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.join(
  path.dirname(
    createRequire(path.join(process.cwd(), 'package.json')).resolve(
      '@rockaway/tokens/package.json',
    ),
  ),
  'terminal',
);

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { format: string; file: string }[] {
  return readdirSync(root).flatMap((format) =>
    readdirSync(path.join(root, format)).map((file) => ({ format, file })),
  );
}

const types: Record<string, string> = {
  '.itermcolors': 'application/xml',
  '.toml': 'application/toml',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ format: string; file: string }> },
): Promise<Response> {
  const { format, file } = await params;
  const at = path.join(root, format, file);
  return new Response(readFileSync(at), {
    headers: { 'content-type': types[path.extname(at)] ?? 'text/plain; charset=utf-8' },
  });
}
