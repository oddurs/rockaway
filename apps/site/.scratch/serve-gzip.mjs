// dist under /rockaway/, gzipped as GitHub Pages serves it. Not a test.
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = process.env.DIST ?? path.join(import.meta.dirname, '..', 'dist');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};
const { servePackageFile } = await import('../test/checks.ts');
createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const module = servePackageFile(url.pathname);
  if (module !== undefined) return res.writeHead(200, { 'content-type': 'text/javascript' }).end(module);
  if (!url.pathname.startsWith('/rockaway/')) return res.writeHead(404).end();
  let file = path.join(dist, decodeURIComponent(url.pathname.slice('/rockaway/'.length)));
  try {
    if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const body = readFileSync(file);
    const ext = path.extname(file);
    const zip = ext !== '.woff2' && ext !== '.png';
    res.writeHead(200, {
      'content-type': types[ext] ?? 'application/octet-stream',
      ...(zip ? { 'content-encoding': 'gzip' } : {}),
    });
    res.end(zip ? gzipSync(body) : body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(Number(process.env.PORT ?? 4330));
console.log('serving on 4330');
