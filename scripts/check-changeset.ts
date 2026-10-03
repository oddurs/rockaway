/**
 * Fails a branch that changes what a package ships without a changeset (cairn 0162).
 *
 * What a package ships is its source, every directory in its `files`, and the
 * fields of its package.json that reach an install (cairn 0173). A test, a
 * story, a script or a devDependency changes nothing a user installs and needs
 * nothing.
 * Every package touched that way must be named by a changeset this branch adds
 * or edits. A change that ships but that no user will notice (a comment, a
 * rename inside a module) is written out instead, as an empty changeset whose
 * body says why: `pnpm changeset --empty`, then fill in the reason.
 *
 *   node scripts/check-changeset.ts [base]    # base defaults to origin/main
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const root = path.join(import.meta.dirname, '..');
const base = process.argv[2] ?? 'origin/main';

// Quietly: asking for a file the base does not have is how a new package is found.
const git = (...args: string[]): string =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

// The branch's own changes, from where it left the base rather than the base's
// tip, and including what is not committed yet, so it can be run before a push.
const since = git('merge-base', base, 'HEAD');
const changed = [
  ...git('diff', '--name-only', since).split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean);

/** Package directory name → package name, for every published package. */
const packages = new Map<string, { name: string; ships: string[] }>();
for (const dir of readdirSync(path.join(root, 'packages'))) {
  const file = path.join(root, 'packages', dir, 'package.json');
  if (!existsSync(file)) continue;
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as {
    name: string;
    private?: boolean;
    files?: string[];
  };
  if (manifest.private) continue;
  // `dist` is built from `src`, so `src` stands in for it.
  const ships = new Set(['src', ...(manifest.files ?? [])].filter((entry) => entry !== 'dist'));
  packages.set(dir, { name: manifest.name, ships: [...ships] });
}

/**
 * The fields of a manifest a user receives (cairn 0173): what resolves, what
 * installs with it, and what a bundler is told about it. Scripts,
 * devDependencies and the version are left out: none reaches an install, and
 * the release itself writes the version.
 */
const published = [
  'name',
  'type',
  'exports',
  'main',
  'module',
  'types',
  'bin',
  'files',
  'sideEffects',
  'dependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'optionalDependencies',
  'engines',
  'publishConfig',
] as const;

/** The published fields that differ between the base and the branch, by name. */
function manifestChanges(file: string): string[] {
  let before: Record<string, unknown> = {};
  try {
    before = JSON.parse(git('show', `${since}:${file}`)) as Record<string, unknown>;
  } catch {
    // A package new on this branch: every field it publishes is a change.
  }
  const after = JSON.parse(readFileSync(path.join(root, file), 'utf8')) as Record<string, unknown>;
  return published.filter((field) => !isDeepStrictEqual(before[field], after[field]));
}

/** The packages whose shipped files this branch changes, with one file each as the example. */
const touched = new Map<string, string>();
for (const file of changed) {
  const [top, dir, first] = file.split('/');
  const pkg = top === 'packages' && dir !== undefined ? packages.get(dir) : undefined;
  if (pkg === undefined || first === undefined || touched.has(pkg.name)) continue;
  if (pkg.ships.includes(first)) {
    touched.set(pkg.name, file);
  } else if (first === 'package.json' && existsSync(path.join(root, file))) {
    const fields = manifestChanges(file);
    if (fields.length > 0) touched.set(pkg.name, `${file}: ${fields.join(', ')}`);
  }
}

if (touched.size === 0) {
  console.log('No package ships anything new on this branch: no changeset needed.');
  process.exit(0);
}

/** What the branch's changesets cover: the packages named, and whether one is a reasoned empty one. */
const named = new Set<string>();
let excused = false;
const changesets = changed.filter(
  (file) => /^\.changeset\/[^/]+\.md$/.test(file) && file !== '.changeset/README.md',
);
for (const file of changesets) {
  const full = path.join(root, file);
  if (!existsSync(full)) continue; // deleted on this branch
  const match = /^---\n([\s\S]*?)^---\n([\s\S]*)$/m.exec(readFileSync(full, 'utf8'));
  if (match === null) continue;
  const [, front = '', body = ''] = match;
  const packagesNamed = [...front.matchAll(/^\s*['"]?(@?[^'":\s]+)['"]?\s*:/gm)].map((m) => m[1]);
  for (const name of packagesNamed) if (name !== undefined) named.add(name);
  if (packagesNamed.length === 0 && body.trim() !== '') excused = true;
}

const missing = [...touched].filter(([name]) => !named.has(name));
if (missing.length === 0) {
  console.log(`Changesets cover ${[...touched.keys()].join(', ')}.`);
  process.exit(0);
}
if (excused) {
  console.log(
    `An empty changeset explains why these need none: ${missing.map(([n]) => n).join(', ')}.`,
  );
  process.exit(0);
}

console.error(
  'These packages change what they ship, and no changeset on this branch names them:\n',
);
for (const [name, file] of missing) console.error(`  ${name}  (${file})`);
console.error(
  [
    '',
    'Run `pnpm changeset` and say what a user of the package will notice.',
    'If they will notice nothing, run `pnpm changeset --empty` and write why in its body.',
    'CONTRIBUTING.md says which change is major, minor or patch.',
  ].join('\n'),
);
process.exit(1);
