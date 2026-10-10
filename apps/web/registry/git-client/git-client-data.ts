/**
 * The git client's model (cairn 0151): a working tree, an index and a log,
 * as plain data, and what each command does to them. Pure and seeded, so the
 * app's text snapshot is a fixture and its tests need no repository.
 */
export type Change = 'M' | 'A' | 'D';

export interface FileChange {
  readonly path: string;
  readonly change: Change;
  readonly staged: boolean;
  /** The file's diff, as `git diff` prints it, without the header. */
  readonly diff: string;
}

export interface Commit {
  readonly hash: string;
  readonly summary: string;
  readonly author: string;
  readonly age: string;
}

export interface Repo {
  readonly branch: string;
  /** Commits ahead of the remote. */
  readonly ahead: number;
  readonly files: readonly FileChange[];
  readonly log: readonly Commit[];
}

export const REPO: Repo = {
  branch: 'main',
  ahead: 2,
  files: [
    {
      path: 'src/components/list.tsx',
      change: 'M',
      staged: false,
      diff: [
        '@@ -41,7 +41,9 @@ export function List<T extends object>({',
        '   const rows = useRows(collection);',
        '-  const height = rows.length;',
        '+  const height = Math.min(rows.length, visible);',
        '+  const offset = clamp(scroll, 0, height - visible);',
        '   return (',
        '     <ListBox',
        '-      style={{ height }}',
        '+      style={{ height, offset }}',
      ].join('\n'),
    },
    {
      path: 'src/components/tree.tsx',
      change: 'A',
      staged: false,
      diff: [
        '@@ -0,0 +1,6 @@',
        "+'use client';",
        '+',
        "+import { Tree as AriaTree } from 'react-aria-components';",
        '+',
        '+export function Tree(props: TreeProps) {',
        '+  return <AriaTree {...props} />;',
      ].join('\n'),
    },
    {
      path: 'docs/old.md',
      change: 'D',
      staged: false,
      diff: ['@@ -1,3 +0,0 @@', '-# Old', '-', '-This page moved to the site.'].join('\n'),
    },
    {
      path: 'README.md',
      change: 'M',
      staged: true,
      diff: [
        '@@ -12,4 +12,4 @@ rockaway',
        ' The constraint is the point.',
        '-Nothing is published yet.',
        '+0.1 is on its way.',
      ].join('\n'),
    },
  ],
  log: [
    {
      hash: '3f2a1c4',
      summary: 'Make the continuity stories readable',
      author: 'oddurs',
      age: '2h',
    },
    {
      hash: '1e0331f',
      summary: "Paint a screen's chrome on the server",
      author: 'oddurs',
      age: '5h',
    },
    {
      hash: '3ff30a8',
      summary: "Keep a field's group props off its frame",
      author: 'oddurs',
      age: '1d',
    },
    { hash: '6cb5f1e', summary: 'Hide every native scrollbar', author: 'oddurs', age: '2d' },
    {
      hash: '88a36c6',
      summary: 'Add Tree, its depth drawn as guides',
      author: 'oddurs',
      age: '3d',
    },
  ],
};

/** Stage a file, or unstage it. */
export function toggleStaged(repo: Repo, path: string): Repo {
  return {
    ...repo,
    files: repo.files.map((f) => (f.path === path ? { ...f, staged: !f.staged } : f)),
  };
}

/** Stage exactly these files, and unstage the rest. */
export function stageOnly(repo: Repo, paths: ReadonlySet<string>): Repo {
  return { ...repo, files: repo.files.map((f) => ({ ...f, staged: paths.has(f.path) })) };
}

/** The directory a path is in, `''` at the top. */
export function dirOf(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash < 0 ? '' : path.slice(0, slash);
}

/** Throw away a change that is not staged. */
export function discard(repo: Repo, path: string): Repo {
  return { ...repo, files: repo.files.filter((f) => f.path !== path || f.staged) };
}

/** A short hash for the nth commit made here: the same every run. */
export function hashOf(n: number): string {
  return ((0x9e3779b1 * (n + 1)) >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

/** Commit what is staged: it leaves the index, and heads the log. */
export function commit(repo: Repo, summary: string, author = 'you'): Repo {
  const made = repo.log.length - REPO.log.length;
  return {
    ...repo,
    ahead: repo.ahead + 1,
    files: repo.files.filter((f) => !f.staged),
    log: [{ hash: hashOf(made), summary, author, age: 'now' }, ...repo.log],
  };
}

/** What a diff's line is, for its colour: syntax roles, so a theme draws them. */
export function roleOf(line: string): 'inserted' | 'deleted' | 'comment' | 'plain' {
  if (line.startsWith('@@')) return 'comment';
  if (line.startsWith('+')) return 'inserted';
  if (line.startsWith('-')) return 'deleted';
  return 'plain';
}
