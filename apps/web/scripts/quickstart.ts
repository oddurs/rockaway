/**
 * The getting-started guide, followed the way a stranger would follow it
 * (cairn 0107, and the job 0155 runs in CI).
 *
 *   pnpm build && pnpm --filter web quickstart [vite] [next] [registry]
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
 * `registry` does the same for the copy-in registry (cairn 0046): it serves the
 * built site's `/r/`, scaffolds a Vite app, and copies every item in with
 * shadcn's own CLI, as the registry page tells a reader to. The app renders
 * each item, is built for production, and every screen it draws is read back
 * as text and compared with the same item drawn on the built site's registry
 * page. Until there is a release (0045), the items' dependency on
 * `@rockaway/react` is served pointing at the packed tarball; nothing else
 * about them changes.
 *
 * It needs the network: the starters, the frameworks and shadcn come from npm.
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
import { BASE } from '../lib/paths.ts';
import { items } from '../registry/items.ts';

/** The site's base, as a path to put a file's name after: `/rockaway/`. */
const DEFAULT_BASE = `${BASE}/`;

const root = path.resolve(import.meta.dirname, '../../..');
export const guide: string = path.join(root, 'docs', 'getting-started.md');

/** The starters, pinned, so a release of either cannot change what this proves. */
const CREATE_VITE = 'create-vite@9.2.1';
const CREATE_NEXT = 'create-next-app@16.3.8';
const SHADCN = 'shadcn@4.21.1';

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

/** `run`, without blocking: for a command that talks to a server this process is serving. */
function runAsync(command: string, args: string[], cwd: string): Promise<void> {
  console.log(`\n$ ${command} ${args.join(' ')}   (in ${path.basename(cwd)})`);
  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, CI: '1' },
  });
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args[0]} exited with ${code}`)),
    );
  });
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

function scaffold(app: App, work: string, tarballs: string[], name = `${app}-app`): string {
  // Named relative to where the starter runs, as a person would type it.
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
 * The bare imports those modules make, of the engine and the tokens, are
 * pointed at the installed packages.
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
          .replace(
            /from (['"])@rockaway\/(grid|tokens)\1/g,
            'from $1/node_modules/@rockaway/$2/dist/index.js$1',
          );
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

/**
 * Every screen on a page that is not inside another, read back as text, once
 * `count` frames have painted.
 */
async function readScreens(url: string, modules: string, count: number): Promise<string[]> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    // The site in the system's default theme, as an app with no provider
    // draws, rather than the site's own.
    await page.addInitScript(() =>
      localStorage.setItem('rockaway:look', JSON.stringify({ theme: 'default' })),
    );
    await page.goto(url);
    await page.waitForFunction(
      (n) =>
        (document.querySelector('#content') ?? document).querySelectorAll(
          '.rk-screen:not(.site-chrome) > .rk-frame[data-rk-painted]',
        ).length >= n,
      count,
    );
    // On the site, each item comes alive as it nears the view: read it live,
    // as the app's is, so both draw the reader's keyboard and glyphs.
    await page.evaluate(async () => {
      const scroller = document.querySelector<HTMLElement>('[data-site-scroll="page"]');
      if (!scroller) return;
      while (scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1) {
        scroller.scrollBy({ top: scroller.clientHeight / 2 });
        await new Promise((done) => setTimeout(done, 150));
      }
      await new Promise((done) => setTimeout(done, 1000));
    });
    const texts = await page.evaluate(async (from) => {
      const { screenshot } = await import(
        `${from}/node_modules/@rockaway/react/dist/testing/index.js`
      );
      // The page's screens, not the site's own chrome round them.
      const from_ = document.querySelector('#content') ?? document;
      return [...from_.querySelectorAll<HTMLElement>('.rk-screen:not(.site-chrome)')]
        .filter((screen) => !screen.parentElement?.closest('.rk-screen'))
        .map((screen) => screenshot(screen, { legend: false }) as string);
    }, modules);
    if (errors.length > 0) throw new Error(`the page threw:\n  ${errors.join('\n  ')}`);
    return texts;
  } finally {
    await browser.close();
  }
}

/**
 * Serves the built site under its base, with each registry item's
 * dependencies on the packages pointed at the packed tarballs, which is the
 * one thing a release (0045) will make unnecessary.
 */
function serveSite(dist: string, tarballs: string[]): Promise<Server> {
  const tarball = (pkg: string) =>
    tarballs.find((t) => path.basename(t).startsWith(`${pkg.replace('@', '').replace('/', '-')}-`));
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(DEFAULT_BASE)) {
      response.writeHead(404).end();
      return;
    }
    let file = path.join(dist, decodeURIComponent(url.pathname.slice(DEFAULT_BASE.length)));
    try {
      if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
      let body: string | Buffer = readFileSync(file);
      if (/\/r\/[^/]+\.json$/.test(url.pathname)) {
        const item = JSON.parse(body.toString('utf8'));
        if (Array.isArray(item.dependencies)) {
          item.dependencies = item.dependencies.map((dep: string) => {
            const packed = tarball(dep);
            return packed ? `${dep}@file:${packed}` : dep;
          });
        }
        body = JSON.stringify(item);
      }
      response.writeHead(200, {
        'content-type': types[path.extname(file)] ?? 'application/octet-stream',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** shadcn's config for an app that has no Tailwind: where copied code goes, and nothing else. */
const COMPONENTS_JSON = {
  $schema: 'https://ui.shadcn.com/schema.json',
  style: 'new-york',
  rsc: false,
  tsx: true,
  tailwind: { config: '', css: 'src/index.css', baseColor: 'neutral', cssVariables: false },
  aliases: {
    components: 'src/components',
    ui: 'src/components/ui',
    utils: 'src/lib/utils',
    lib: 'src/lib',
    hooks: 'src/hooks',
  },
};

/**
 * The registry, as a reader uses it: `shadcn add` for every item into a new
 * Vite app, which then draws each one exactly as the registry page does.
 */
async function proveRegistry(work: string, tarballs: string[], guideText: string): Promise<void> {
  const dist = path.join(root, 'apps', 'web', 'out');
  if (!statSync(path.join(dist, 'r', 'registry.json'), { throwIfNoEntry: false })) {
    throw new Error('the site is not built: run `pnpm build` first');
  }
  const dir = scaffold('vite', work, tarballs, 'registry-app');
  writeFileSync(path.join(dir, 'components.json'), `${JSON.stringify(COMPONENTS_JSON, null, 2)}\n`);

  const site = await serveSite(dist, tarballs);
  let modules: Server | undefined;
  let page: Server | undefined;
  try {
    const index = (await (
      await fetch(`${address(site)}${DEFAULT_BASE}r/registry.json`)
    ).json()) as {
      items: { name: string }[];
    };
    for (const { name } of index.items) {
      // shadcn fetches the item from the server in this process, so this must not block it.
      await runAsync(
        'npx',
        ['--yes', SHADCN, 'add', `${address(site)}${DEFAULT_BASE}r/${name}.json`, '--yes'],
        dir,
      );
    }

    // The guide's entry, which imports the CSS once, and an App that draws every item.
    const main = fromGuide(guideText).files.vite['src/main.tsx'];
    if (!main) throw new Error('the guide has no src/main.tsx for vite');
    writeFileSync(path.join(dir, 'src', 'main.tsx'), main);
    const app = [
      ...items.map((item) => `import { ${item.component} } from './components/${item.name}';`),
      '',
      'export function App() {',
      '  return (',
      '    <>',
      ...items.map((item) => `      <${item.component} />`),
      '    </>',
      '  );',
      '}',
      '',
    ].join('\n');
    writeFileSync(path.join(dir, 'src', 'App.tsx'), app);
    run('npm', ['run', 'build'], dir);

    modules = await serve(dir, dir);
    page = await serve(path.join(dir, 'dist'), dir);
    const got = await readScreens(address(page), address(modules), items.length);
    const want = await readScreens(
      `${address(site)}${DEFAULT_BASE}registry/`,
      address(modules),
      items.length,
    );
    if (got.length !== items.length || got.join('\n\n') !== want.join('\n\n')) {
      throw new Error(
        `registry: the copied items do not draw what the registry page draws.\n\n` +
          `site:\n${want.join('\n\n')}\n\napp:\n${got.join('\n\n')}`,
      );
    }
    console.log(`\nregistry: ${items.length} items copied in, drawn as on the site\n`);
    console.log(got.join('\n\n'));
  } finally {
    page?.close();
    modules?.close();
    site.close();
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
  const asked = process.argv.slice(2);
  const runs = (asked.length ? asked : ['vite', 'next', 'registry']) as (App | 'registry')[];
  const work = mkdtempSync(path.join(tmpdir(), 'rockaway-quickstart-'));
  console.log(`working in ${work}`);
  const tarballs = pack(path.join(work, 'packages'));
  const text = readFileSync(guide, 'utf8');
  for (const app of runs) {
    if (app === 'registry') await proveRegistry(work, tarballs, text);
    else await prove(app, work, tarballs, text);
  }
}
