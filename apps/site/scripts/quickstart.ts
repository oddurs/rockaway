/**
 * The getting-started guide, followed the way a stranger would follow it
 * (cairn 0107, and the job 0155 runs in CI).
 *
 *   pnpm build && node apps/site/scripts/quickstart.ts [vite] [next]
 *
 * Packs the four packages as npm would publish them, scaffolds a new app
 * outside the workspace with the framework's own starter, installs the
 * tarballs, and writes in the guide's code. The code comes out of
 * `docs/getting-started.md` itself: every fence marked `quickstart="vite"` or
 * `quickstart="next"` is a file, named by its `file` attribute. The app is
 * built for production and served, and a browser reads the screen back as
 * text and compares it with the fence marked `quickstart="screen"`. If the
 * guide and the packages disagree, this fails.
 *
 * It needs the network: the starters and the frameworks come from npm.
 */
import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '../../..');
export const guide: string = path.join(root, 'docs', 'getting-started.md');

/** The starters, pinned, so a release of either cannot change what this proves. */
const CREATE_VITE = 'create-vite@9.2.1';
const CREATE_NEXT = 'create-next-app@16.3.8';

export type App = 'vite' | 'next';

export interface Fence {
  readonly lang: string;
  readonly attrs: Readonly<Record<string, string>>;
  readonly code: string;
}

/** Every fenced block in a Markdown document, with the attributes after its language. */
export function fences(markdown: string): Fence[] {
  return [...markdown.matchAll(/^```(\w*)([^\n]*)\n([\s\S]*?)^```$/gm)].map((m) => ({
    lang: m[1] ?? '',
    attrs: Object.fromEntries(
      [...(m[2] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1] ?? '', a[2] ?? '']),
    ),
    code: m[3] ?? '',
  }));
}

/** The files the guide gives an app, by path, and the screen it promises. */
export function fromGuide(markdown: string): {
  files: Record<App, Record<string, string>>;
  screen: string;
} {
  const all = fences(markdown);
  const files: Record<App, Record<string, string>> = { vite: {}, next: {} };
  for (const f of all) {
    const app = f.attrs.quickstart;
    if ((app === 'vite' || app === 'next') && f.attrs.file) files[app][f.attrs.file] = f.code;
  }
  const screen = all.find((f) => f.attrs.quickstart === 'screen')?.code;
  if (!screen) throw new Error('the guide has no fence marked quickstart="screen"');
  return { files, screen: screen.replace(/\n$/, '') };
}

function run(command: string, args: string[], cwd: string): void {
  console.log(`\n$ ${command} ${args.join(' ')}   (in ${path.basename(cwd)})`);
  execFileSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, CI: '1' } });
}

/** `pnpm pack` each package, which applies publishConfig as publishing would. */
function pack(into: string): string[] {
  mkdirSync(into, { recursive: true });
  for (const name of ['grid', 'tokens', 'css', 'react']) {
    execFileSync('pnpm', ['pack', '--pack-destination', into], {
      cwd: path.join(root, 'packages', name),
      stdio: 'pipe',
    });
  }
  return readdirSync(into)
    .filter((f) => f.endsWith('.tgz'))
    .map((f) => path.join(into, f));
}

function scaffold(app: App, work: string, tarballs: string[]): string {
  // Named relative to where the starter runs, as a person would type it.
  const name = `${app}-app`;
  const dir = path.join(work, name);
  if (app === 'vite') {
    run('npx', ['--yes', CREATE_VITE, name, '--template', 'react-ts', '--no-interactive'], work);
  } else {
    run(
      'npx',
      [
        '--yes',
        CREATE_NEXT,
        name,
        '--app',
        '--ts',
        '--no-tailwind',
        '--no-src-dir',
        '--use-npm',
        '--disable-git',
        '--yes',
      ],
      work,
    );
  }
  run('npm', ['install', '--no-audit', '--no-fund'], dir);
  // What the guide's install line does, from the tarballs until there is a release.
  run('npm', ['install', '--no-audit', '--no-fund', ...tarballs], dir);
  return dir;
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
};

/**
 * Serves a directory, plus the installed packages under `/node_modules/`, so
 * the check can load `@rockaway/react/testing` from what the app installed.
 * The one bare import those modules make is pointed at the installed engine.
 */
function serve(dir: string, app: string): Promise<Server> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const fromModules = url.pathname.startsWith('/node_modules/');
    let file = path.join(fromModules ? app : dir, decodeURIComponent(url.pathname));
    try {
      if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
      let body: string | Buffer = readFileSync(file);
      if (fromModules && file.endsWith('.js')) {
        body = body
          .toString('utf8')
          .replaceAll(`from '@rockaway/grid'`, `from '/node_modules/@rockaway/grid/dist/index.js'`)
          .replaceAll(`from "@rockaway/grid"`, `from "/node_modules/@rockaway/grid/dist/index.js"`);
      }
      response.writeHead(200, {
        'content-type': types[path.extname(file)] ?? 'application/octet-stream',
        'access-control-allow-origin': '*',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const address = (server: Server): string =>
  `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

async function waitFor(url: string, child: ChildProcess): Promise<void> {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(`the server exited with ${child.exitCode}`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${url} never answered`);
}

/** The screen on the page, read back as text by the installed testing helper. */
async function readScreen(url: string, modules: string): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForSelector('.rk-screen [data-rk-painted]');
    const text = await page.evaluate(async (from) => {
      const { screenshot } = await import(
        `${from}/node_modules/@rockaway/react/dist/testing/index.js`
      );
      return screenshot(document.querySelector('.rk-screen') as HTMLElement, { legend: false });
    }, modules);
    if (errors.length > 0) throw new Error(`the page threw:\n  ${errors.join('\n  ')}`);
    return text as string;
  } finally {
    await browser.close();
  }
}

async function prove(app: App, work: string, tarballs: string[], guideText: string): Promise<void> {
  const { files, screen } = fromGuide(guideText);
  if (Object.keys(files[app]).length === 0) throw new Error(`the guide has no files for ${app}`);
  const dir = scaffold(app, work, tarballs);
  for (const [file, code] of Object.entries(files[app])) {
    console.log(`writes ${file} from the guide`);
    writeFileSync(path.join(dir, file), code);
  }
  run('npm', ['run', 'build'], dir);

  const modules = await serve(dir, dir);
  let page: Server | undefined;
  let next: ChildProcess | undefined;
  try {
    let url: string;
    if (app === 'vite') {
      page = await serve(path.join(dir, 'dist'), dir);
      url = address(page);
    } else {
      const port = 4300 + Math.floor(Math.random() * 500);
      next = spawn('npx', ['next', 'start', '-p', String(port)], { cwd: dir, stdio: 'ignore' });
      url = `http://127.0.0.1:${port}`;
      await waitFor(url, next);
    }
    const got = await readScreen(url, address(modules));
    if (got !== screen) {
      throw new Error(
        `${app}: the screen is not what the guide says.\n\nguide:\n${screen}\n\npage:\n${got}`,
      );
    }
    console.log(`\n${app}: the screen matches the guide\n${got}`);
  } finally {
    next?.kill();
    page?.close();
    modules.close();
  }
}

if (process.argv[1] === import.meta.filename) {
  const apps = (process.argv.slice(2).length ? process.argv.slice(2) : ['vite', 'next']) as App[];
  const work = mkdtempSync(path.join(tmpdir(), 'rockaway-quickstart-'));
  console.log(`working in ${work}`);
  const tarballs = pack(path.join(work, 'packages'));
  const text = readFileSync(guide, 'utf8');
  for (const app of apps) await prove(app, work, tarballs, text);
}
