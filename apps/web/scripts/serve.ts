/**
 * The export, served the way GitHub Pages serves it: under the base path,
 * gzipped, a directory's `index.html` for the directory, and `404.html` for
 * anything else. For the tests and for looking at a build; not a dev server.
 *
 *   node scripts/serve.ts            # http://localhost:4340/rockaway/
 *   PORT=4341 node scripts/serve.ts
 */
import { readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
};

/** Already compressed: sent as they are. */
const STORED = new Set(['.woff2', '.png']);

export interface Serving {
  readonly url: string;
  readonly close: () => Promise<void>;
}

/** Serve `dir` under `base` on `port` (0 for any free one). */
export function serve(
  dir = path.join(import.meta.dirname, '..', 'out'),
  { base = '/rockaway', port = 4340 }: { base?: string; port?: number } = {},
): Promise<Serving> {
  const cache = new Map<string, Buffer>();
  const send = (res: import('node:http').ServerResponse, file: string, status = 200): void => {
    const ext = path.extname(file);
    // Keyed by when the file changed, so a new build is served at once.
    const key = `${file}@${statSync(file).mtimeMs}`;
    let body = cache.get(key);
    if (body === undefined) {
      body = readFileSync(file);
      if (!STORED.has(ext)) body = gzipSync(body);
      cache.set(key, body);
    }
    res.writeHead(status, {
      'content-type': TYPES[ext] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
      ...(STORED.has(ext) ? {} : { 'content-encoding': 'gzip' }),
    });
    res.end(body);
  };
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const missing = (): void => send(res, path.join(dir, '404.html'), 404);
    if (!url.pathname.startsWith(`${base}/`) && url.pathname !== base) return missing();
    let file = path.join(dir, decodeURIComponent(url.pathname.slice(base.length)));
    if (!file.startsWith(dir)) return missing();
    try {
      if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
      send(res, file);
    } catch {
      missing();
    }
  });
  return new Promise((done) => {
    server.listen(port, () => {
      const address = server.address();
      const at = typeof address === 'object' && address ? address.port : port;
      done({
        url: `http://localhost:${at}${base}/`,
        close: () => new Promise((closed) => server.close(() => closed())),
      });
    });
  });
}

if (import.meta.main) {
  const { url } = await serve(undefined, { port: Number(process.env.PORT ?? 4340) });
  console.log(`serving the export at ${url}`);
}
