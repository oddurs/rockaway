/**
 * What each tool answers (cairn 0048), as plain functions over the snapshot,
 * so they can be tested without a transport. `server.ts` puts them on MCP.
 */
import type { ComponentMeta } from '@rockaway/react/metadata';
import { resolverFile, resolveTree, resolveValue, toHex } from '@rockaway/tokens';
import type { Data } from './data.ts';

/** `KeyHint` is `key-hint`, as the site addresses it. */
export function slugOf(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export interface ComponentSummary {
  readonly name: string;
  readonly summary: string;
  /** What to import it as, root first. */
  readonly imports: readonly string[];
}

export function listComponents(data: Data): ComponentSummary[] {
  return data.components.map((c) => ({
    name: c.name,
    summary: c.summary,
    imports: c.anatomy.filter((p) => p.kind === 'import').map((p) => p.name),
  }));
}

/** A component by its name or its slug, in any case: `KeyHint`, `key-hint`, `keyhint`. */
export function findComponent(data: Data, name: string): ComponentMeta | undefined {
  const wanted = name
    .trim()
    .toLowerCase()
    .replace(/[-_\s]/g, '');
  return data.components.find((c) => c.name.toLowerCase() === wanted);
}

// ── Tokens ──────────────────────────────────────────────────────────────────

/** A context the tokens resolve in: one value per resolver modifier. */
export type Context = Readonly<Record<string, string>>;

interface Modifier {
  readonly default: string;
  readonly contexts: Readonly<Record<string, unknown>>;
}

/** The resolver's modifiers, each with its values and its default: theme, mode, density. */
export function modifiers(data: Data): Record<string, { values: string[]; default: string }> {
  const resolver = data.tokens[resolverFile] as { modifiers: Record<string, Modifier> };
  return Object.fromEntries(
    Object.entries(resolver.modifiers).map(([name, m]) => [
      name,
      { values: Object.keys(m.contexts), default: m.default },
    ]),
  );
}

export interface TokenRow {
  /** The custom property a stylesheet reads: `--rk-fg-muted`. */
  readonly name: string;
  /** Its DTCG path: `fg.muted`. */
  readonly path: string;
  readonly type?: string;
  readonly description?: string;
  /** The value as written: an alias such as `{ansi.blue}`, or a value. */
  readonly value: unknown;
  /** The value it comes to in this context, aliases followed. */
  readonly resolved: unknown;
  /** The resolved value as CSS can write it: a colour in sRGB hex, a dimension with its unit. */
  readonly css?: string;
}

type Node = Record<string, unknown>;

/** A resolved DTCG value, written as CSS. */
function cssOf(type: string | undefined, value: unknown): string | undefined {
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (typeof value !== 'object' || value === null) return undefined;
  if (type === 'color' && 'components' in value) {
    const [l = 0, c = 0, h = 0] = (value as { components: number[] }).components;
    return toHex({ l, c, h });
  }
  if ('value' in value && 'unit' in value) {
    const { value: v, unit } = value as { value: number; unit: string };
    return `${v}${unit}`;
  }
  return undefined;
}

/**
 * Every token with a custom property, in a context, under a group if one is
 * given (`fg`, `bg.accent`). The context defaults to the resolver's defaults.
 */
export function getTokens(
  data: Data,
  { group, context = {} }: { group?: string | undefined; context?: Context } = {},
): { context: Context; tokens: TokenRow[] } {
  const known = modifiers(data);
  const full: Record<string, string> = {};
  for (const [name, { values, default: fallback }] of Object.entries(known)) {
    const asked = context[name];
    if (asked !== undefined && !values.includes(asked)) {
      throw new RangeError(`${name} is one of ${values.join(', ')}, not ${asked}`);
    }
    full[name] = asked ?? fallback;
  }
  const tree = resolveTree(new Map(Object.entries(data.tokens)), full);

  const tokens: TokenRow[] = [];
  const walk = (node: Node, path: string[], type: string | undefined): void => {
    const own = typeof node.$type === 'string' ? node.$type : type;
    if ('$value' in node) {
      const at = path.join('.');
      const name = data.vars[at];
      if (name === undefined) return;
      if (group && at !== group && !at.startsWith(`${group}.`)) return;
      const resolved = resolveValue(tree, at);
      const css = cssOf(own, resolved);
      tokens.push({
        name,
        path: at,
        ...(own === undefined ? {} : { type: own }),
        ...(typeof node.$description === 'string' ? { description: node.$description } : {}),
        value: node.$value,
        resolved,
        ...(css === undefined ? {} : { css }),
      });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || typeof child !== 'object' || child === null) continue;
      walk(child as Node, [...path, key], own);
    }
  };
  walk(tree, [], undefined);
  return { context: full, tokens: tokens.sort((a, b) => a.path.localeCompare(b.path)) };
}

// ── Search ──────────────────────────────────────────────────────────────────

/** A piece of the documentation a search can return. */
export interface Section {
  /** Where it is: `docs/concept.md`, or `components/key-hint` for a component. */
  readonly source: string;
  /** Its title, with the headings above it: `The concept › 1. A frame is data`. */
  readonly title: string;
  readonly text: string;
}

/** Every document cut at its `##` and `###` headings, and every component as one section. */
export function sections(data: Data): Section[] {
  const out: Section[] = [];
  for (const doc of data.docs) {
    const trail: string[] = [];
    let title = doc.path;
    let lines: string[] = [];
    let fence = false;
    const flush = () => {
      const text = lines.join('\n').trim();
      if (text) out.push({ source: doc.path, title, text });
      lines = [];
    };
    for (const line of doc.markdown.split('\n')) {
      if (/^(`{3,}|~{3,})/.test(line)) fence = !fence;
      const heading = fence ? null : /^(#{1,3})\s+(.*)$/.exec(line);
      if (heading) {
        flush();
        const depth = (heading[1] ?? '#').length;
        trail.length = depth - 1;
        trail[depth - 1] = (heading[2] ?? '').trim();
        title = trail.filter(Boolean).join(' › ');
      }
      lines.push(line);
    }
    flush();
  }
  for (const c of data.components) {
    out.push({
      source: `components/${slugOf(c.name)}`,
      title: c.name,
      text: [
        `# ${c.name}`,
        c.summary,
        c.description,
        'When to use:',
        ...c.whenToUse.map((w) => `- ${w}`),
        'When not to use:',
        ...c.whenNotToUse.map((w) => `- ${w.text}${w.instead ? ` (use ${w.instead})` : ''}`),
      ].join('\n'),
    });
  }
  return out;
}

const terms = (query: string): string[] => [
  ...new Set(
    query
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 1),
  ),
];

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

/**
 * The sections that best match a query: the most of its words first, then the
 * most occurrences, a word in the title counting thrice.
 */
export function searchDocs(data: Data, query: string, limit = 5): Section[] {
  const words = terms(query);
  if (words.length === 0) return [];
  return sections(data)
    .map((section, order) => {
      const title = section.title.toLowerCase();
      const text = section.text.toLowerCase();
      const matched = words.filter((w) => text.includes(w) || title.includes(w)).length;
      const score = words.reduce((sum, w) => sum + count(text, w) + 3 * count(title, w), 0);
      return { section, matched, score, order };
    })
    .filter((hit) => hit.matched > 0)
    .sort((a, b) => b.matched - a.matched || b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((hit) => hit.section);
}
