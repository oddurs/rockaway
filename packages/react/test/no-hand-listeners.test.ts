/**
 * Behaviour comes from the behaviour layer (rule 4 of the component recipe,
 * 0134; this check is 0252).
 *
 * React Aria owns the keyboard and focus of every control: arrow keys, type
 * ahead, focus rings, focus that survives a re-render, the platform's
 * conventions. A key or focus listener written by hand in a component is a
 * second keyboard beside it, which the Keyboard stories do not walk and the
 * metadata does not list. So a component holds none: no `onKeyDown`,
 * `onFocus`, `onBlur` and their kin on an element or in props it merges, no
 * `addEventListener('keydown' | 'focus…' | 'blur')`, no `el.onkeydown = …`.
 * The page's own shortcuts go through `useKeymap`.
 *
 * An exception is listed below with its reason, and fails when it no longer
 * occurs, so the list cannot outlive what it excuses.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseSync } from 'oxc-parser';
import { describe, expect, test } from 'vitest';

const components = path.join(import.meta.dirname, '..', 'src', 'components');

/** A React prop, or an object key merged into one, that listens to keys or focus. */
const PROP = /^on(?:Key|Focus|Blur)/;
/** A DOM event a listener is added for, or the handler property assigned. */
const EVENT = /^(?:key|focus|blur)/;
const HANDLER = /^on(?:key|focus|blur)/;

/**
 * The listeners a component may hold, by file and what is found, with why.
 */
const ALLOWED: Readonly<Record<string, string>> = {
  "keymap.pure.ts  addEventListener('keydown')":
    'Keymap is the behaviour layer for the page’s own shortcuts (0141): the one document listener every useKeymap binding goes through.',
  'tree.tsx  onFocusedKeyChange':
    'Not a listener: the callback Tree calls with the focused row, which each row reads from React Aria’s render props (0278). Its name says what it reports.',
};

interface AstNode {
  readonly type: string;
  readonly start: number;
  readonly [key: string]: unknown;
}

function* walk(node: unknown): Generator<AstNode> {
  if (Array.isArray(node)) {
    for (const child of node) yield* walk(child);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  const ast = node as AstNode;
  if (typeof ast.type === 'string') yield ast;
  for (const value of Object.values(ast)) if (typeof value === 'object') yield* walk(value);
}

/** The name an identifier-ish node carries: `onKeyDown`, `'keydown'`. */
function nameOf(node: unknown): string | undefined {
  if (node === null || typeof node !== 'object') return undefined;
  const n = node as { name?: unknown; value?: unknown };
  if (typeof n.name === 'string') return n.name;
  if (typeof n.value === 'string') return n.value;
  return undefined;
}

interface Found {
  /** `file  what`, the key the exceptions are listed by. */
  readonly key: string;
  readonly line: number;
}

/** Every hand-written key or focus listener in one source file. */
function listeners(file: string, source: string): Found[] {
  const result = parseSync(file, source);
  if (result.errors.length > 0) {
    throw new Error(`${file}: ${result.errors.map((error) => error.message).join('; ')}`);
  }
  const lineOf = (offset: number): number => source.slice(0, offset).split('\n').length;
  const found: Found[] = [];
  const add = (what: string, node: AstNode): void => {
    found.push({ key: `${file}  ${what}`, line: lineOf(node.start) });
  };
  for (const node of walk(result.program.body)) {
    if (node.type === 'JSXAttribute' || node.type === 'Property') {
      const name = nameOf(node.type === 'JSXAttribute' ? node.name : node.key);
      if (name !== undefined && PROP.test(name)) add(name, node);
    }
    if (node.type === 'CallExpression') {
      const callee = node.callee as { type?: string; property?: unknown } | undefined;
      const event = nameOf((node.arguments as unknown[] | undefined)?.[0]);
      if (
        callee?.type === 'MemberExpression' &&
        nameOf(callee.property) === 'addEventListener' &&
        event !== undefined &&
        EVENT.test(event)
      ) {
        add(`addEventListener('${event}')`, node);
      }
    }
    if (node.type === 'AssignmentExpression') {
      const left = node.left as { type?: string; property?: unknown } | undefined;
      const handler = left?.type === 'MemberExpression' ? nameOf(left.property) : undefined;
      if (handler !== undefined && HANDLER.test(handler)) add(`.${handler} =`, node);
    }
  }
  return found;
}

const sources = readdirSync(components)
  .filter((name) => /\.tsx?$/.test(name))
  .sort()
  .map((name) => ({ file: name, source: readFileSync(path.join(components, name), 'utf8') }));

describe('a component writes no key or focus listener of its own', () => {
  const found = sources.flatMap(({ file, source }) => listeners(file, source));

  test('reads every component', () => {
    expect(sources.length).toBeGreaterThan(10);
  });

  test('none, beyond the listed exceptions', () => {
    const unexcused = found
      .filter(({ key }) => ALLOWED[key] === undefined)
      .map(({ key, line }) => `${key.replace('  ', `:${line}  `)}`);
    expect(unexcused).toEqual([]);
  });

  test('every exception still occurs', () => {
    const seen = new Set(found.map(({ key }) => key));
    expect(Object.keys(ALLOWED).filter((key) => !seen.has(key))).toEqual([]);
  });
});

describe('the check', () => {
  test('finds a listener as a prop, as a merged key, as addEventListener and as a handler', () => {
    const source = `
      export function X({ el }) {
        const props = mergeProps(aria, { onKeyDown: (e) => e });
        el.addEventListener('focusin', () => {});
        el.onblur = () => {};
        return <div onFocus={() => {}} onKeyUpCapture={() => {}} {...props} />;
      }
    `;
    expect(listeners('x.tsx', source).map(({ key, line }) => `${line} ${key}`)).toEqual([
      '3 x.tsx  onKeyDown',
      "4 x.tsx  addEventListener('focusin')",
      '5 x.tsx  .onblur =',
      '6 x.tsx  onFocus',
      '6 x.tsx  onKeyUpCapture',
    ]);
  });

  test('passes other listeners, and React Aria doing the listening', () => {
    const source = `
      export function X({ el }) {
        el.addEventListener('scroll', () => {});
        const { focusProps } = useFocusRing();
        return <Button onPress={() => {}} onHoverStart={() => {}} {...focusProps} />;
      }
    `;
    expect(listeners('x.tsx', source)).toEqual([]);
  });
});
