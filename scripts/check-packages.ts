/**
 * Checks every published package as a consumer receives it (cairn 0121).
 *
 * The workspace resolves through the `@rockaway/source` condition, so nothing
 * else ever touches `dist`. This packs each package, lists what the tarball
 * holds, and runs publint and Are the Types Wrong against the tarball itself,
 * with `publishConfig` applied the way `pnpm publish` applies it. It also fails
 * any shipped module that needs the client but does not say `'use client'`.
 * Run it after `pnpm build`.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

/** An exports condition object, as far as these checks read one. */
interface Target {
  readonly types?: string;
  readonly default?: string;
}

interface Manifest {
  name: string;
  private?: boolean;
  files?: string[];
  exports?: unknown;
  publishConfig?: { exports?: unknown };
}

const root = path.join(import.meta.dirname, '..');
const bin = (name: string): string => path.join(root, 'node_modules', '.bin', name);

/** Files npm adds whatever `files` says. */
const always = new Set(['package.json', 'README.md', 'LICENSE']);

/** Things that are never meant to ship, whichever directory they turn up in. */
const forbidden: ReadonlyArray<[RegExp, string]> = [
  [/(^|\/)(test|tests|__tests__)\//, 'a test directory'],
  [/\.(test|spec)\.[cm]?[jt]sx?$/, 'a test'],
  [/\.stories\.[jt]sx?$/, 'a story'],
  [/(^|\/)__screenshots__\//, 'a screenshot'],
  // What sits beside a component for the workbench, the site and the tests:
  // its example, its metadata fixture and its text snapshots. Nothing in the
  // package imports them, so they are never built; this says so if they are.
  [/\.example\.(d\.)?[cm]?[jt]sx?$/, 'a component example'],
  [/\.fixture\.(d\.)?[cm]?[jt]sx?$/, 'a metadata fixture'],
  [/\.snapshots\.txt$/, 'a text snapshot'],
  // Declarations are allowed, including a stylesheet's (`index.d.css.ts`).
  [/(?<!\.d)(?<!\.d\.[a-z]+)\.[cm]?tsx?$/, 'TypeScript source'],
  [/\.tsbuildinfo$/, 'build state'],
];

/**
 * What makes a module client-only under React Server Components: a hook
 * imported from React, anything from React Aria, or an event handler prop.
 */
const clientOnly: ReadonlyArray<[RegExp, string]> = [
  [/^import\s*\{[^}]*\buse[A-Z]\w*[^}]*\}\s*from\s*["']react["']/m, 'imports a React hook'],
  [/from\s*["']react-(aria|aria-components|stately)["']/, 'imports React Aria'],
  [/\bon[A-Z][A-Za-z]*\s*:/, 'passes an event handler'],
];

/** The directive as a module's first statement, after any leading comments. */
const useClient = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/;

/** The workspace-only condition, removed to give what consumers should see. */
function withoutSource(exports: unknown): unknown {
  if (typeof exports !== 'object' || exports === null) return exports;
  return Object.fromEntries(
    Object.entries(exports)
      .filter(([key]) => key !== '@rockaway/source')
      .map(([key, value]) => [key, withoutSource(value)]),
  );
}

const out = mkdtempSync(path.join(tmpdir(), 'rockaway-pack-'));
const failures: string[] = [];

/** Runs a check, printing its output, and records a failure rather than stopping. */
function run(label: string, command: string, args: string[]): void {
  try {
    execFileSync(command, args, { stdio: 'inherit' });
  } catch {
    failures.push(label);
  }
}

for (const dir of readdirSync(path.join(root, 'packages')).sort()) {
  const cwd = path.join(root, 'packages', dir);
  const manifest = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8')) as Manifest;
  if (manifest.private) continue;
  const { name } = manifest;
  console.log(`\n━━ ${name}\n`);

  // What is published must be the workspace map minus the source condition:
  // two copies of one map, and nothing else keeps them in step.
  const published = manifest.publishConfig?.exports ?? manifest.exports;
  if (!isDeepStrictEqual(published, withoutSource(manifest.exports))) {
    failures.push(`${name}: publishConfig.exports is not exports without @rockaway/source`);
  }

  // Each entry its own build, typed by the declarations emitted beside it. Both
  // tools pass a subpath that quietly points at another entry's file, which is
  // how `./testing` came to resolve to the main bundle.
  const seen = new Map<string, string>();
  for (const [subpath, target] of Object.entries(published ?? {})) {
    if (typeof target !== 'object' || target === null) continue;
    const { types, default: js } = target as Target;
    if (js === undefined) continue;
    // A stylesheet's declarations are named as TypeScript names them for any
    // extension it does not know: `index.css` is typed by `index.d.css.ts`.
    const declarations = js.endsWith('.css')
      ? js.replace(/\.css$/, '.d.css.ts')
      : js.replace(/\.js$/, '.d.ts');
    if (types !== declarations) {
      failures.push(`${name}: ${subpath} is typed by ${types}, not by the declarations for ${js}`);
    }
    const other = seen.get(js);
    if (other !== undefined) {
      failures.push(`${name}: ${subpath} and ${other} both resolve to ${js}`);
    }
    seen.set(js, subpath);
  }

  const packed = JSON.parse(
    execFileSync('pnpm', ['pack', '--json', '--pack-destination', out], { cwd, encoding: 'utf8' }),
  ) as { filename: string; files: { path: string }[] };
  const paths = packed.files.map((file) => file.path).sort();

  console.log(`${paths.length} files in ${path.basename(packed.filename)}:`);
  for (const file of paths) console.log(`  ${file}`);

  const roots = manifest.files ?? [];
  for (const file of paths) {
    if (!always.has(file) && !roots.some((r) => file === r || file.startsWith(`${r}/`))) {
      failures.push(`${name}: ${file} is outside "files"`);
    }
    for (const [pattern, what] of forbidden) {
      if (pattern.test(file)) failures.push(`${name}: ${file} is ${what}`);
    }
  }

  // A component that lands without `'use client'` breaks every server-component
  // app that imports the package, and nothing in the workspace would notice
  // (cairn 0122). The server-component fixture only follows Frame's imports.
  for (const file of paths.filter((p) => p.endsWith('.js'))) {
    const code = readFileSync(path.join(cwd, file), 'utf8');
    if (useClient.test(code)) continue;
    const reason = clientOnly.find(([pattern]) => pattern.test(code))?.[1];
    if (reason !== undefined) {
      failures.push(`${name}: ${file} ${reason} but does not begin with 'use client'`);
    }
  }

  // A pattern subpath (`./*`) is where each component's own entry lives
  // (cairn 0165). attw checks only the subpaths it is told about, so every file
  // a pattern reaches in the tarball becomes one. Patterns over data (the
  // tokens' DTCG files, terminal themes) are not modules, and are left alone.
  const reached: string[] = [];
  for (const [subpath, target] of Object.entries(published ?? {})) {
    const js = typeof target === 'object' && target !== null ? (target as Target).default : target;
    if (!subpath.includes('*') || typeof js !== 'string' || !js.endsWith('*.js')) continue;
    const [before = '', after = ''] = js.replace(/^\.\//, '').split('*');
    for (const file of paths) {
      if (file.length <= before.length + after.length) continue;
      if (!file.startsWith(before) || !file.endsWith(after)) continue;
      const concrete = subpath.replace('*', file.slice(before.length, file.length - after.length));
      if (!(concrete in (published as object))) reached.push(concrete);
    }
  }

  // A component module with no entry beside it cannot be imported on its own,
  // and an islands site would hydrate the whole package to show it.
  for (const file of paths) {
    const component = /^dist\/components\/([a-z0-9-]+)\.js$/.exec(file)?.[1];
    if (component !== undefined && !paths.includes(`dist/entries/${component}.js`)) {
      failures.push(`${name}: ${file} has no entry, so ${name}/${component} does not exist`);
    }
  }

  console.log('');
  run(`${name}: publint`, bin('publint'), ['run', '--strict', packed.filename]);
  // ESM only, deliberately: node10 and CommonJS `require` are out of scope.
  // Stylesheets are entries for a bundler's CSS pipeline, not for TypeScript,
  // so they are left out rather than reported as unresolvable modules.
  const stylesheets = Object.keys(published ?? {}).filter((key) => key.endsWith('.css'));
  run(`${name}: attw`, bin('attw'), [
    '--profile',
    'esm-only',
    '--no-emoji',
    ...(stylesheets.length > 0 ? ['--exclude-entrypoints', ...stylesheets] : []),
    ...(reached.length > 0 ? ['--include-entrypoints', ...reached] : []),
    '--',
    packed.filename,
  ]);
}

rmSync(out, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log('\nEvery package packs cleanly.');
