/**
 * The token reference (cairn 0106), read from the generated DTCG files the
 * package ships, so it cannot drift from the tokens it documents. Nothing here
 * is written by hand but the order the groups are shown in.
 */
import base from '@rockaway/tokens/dtcg/base.tokens.json' with { type: 'json' };
import normal from '@rockaway/tokens/dtcg/density.normal.tokens.json' with { type: 'json' };
import light from '@rockaway/tokens/dtcg/mode.light.tokens.json' with { type: 'json' };
import semantic from '@rockaway/tokens/dtcg/semantic.tokens.json' with { type: 'json' };
import theme from '@rockaway/tokens/dtcg/theme.default.tokens.json' with { type: 'json' };

type Node = Record<string, unknown>;

export interface Token {
  /** The DTCG path: `fg.muted`. */
  readonly path: string;
  /** What CSS reads: `--rk-fg-muted`. */
  readonly css: string;
  readonly type: string;
  /** The value as written: an alias, or the value itself. */
  readonly value: string;
  readonly description: string;
}

function show(value: unknown): string {
  if (typeof value === 'string') {
    const alias = /^\{(.+)\}$/.exec(value);
    // A no-break space: the arrow belongs to the name it points at.
    return alias ? `→\u00a0${alias[1]}` : value;
  }
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(show).join(', ');
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (v.colorSpace === 'oklch' && Array.isArray(v.components)) {
      const [l, c, h] = v.components as number[];
      return `oklch(${(l ?? 0).toFixed(3)} ${(c ?? 0).toFixed(3)} ${(h ?? 0).toFixed(1)})`;
    }
    if ('value' in v && 'unit' in v) return `${v.value}${v.unit}`;
  }
  return JSON.stringify(value);
}

function walk(doc: unknown, trail: string[] = [], type = '', out: Token[] = []): Token[] {
  const node = doc as Node;
  const here = (node.$type as string | undefined) ?? type;
  if ('$value' in node) {
    const path = trail.join('.');
    out.push({
      path,
      css: `--rk-${path.replaceAll('.', '-')}`,
      type: here,
      value: show(node.$value),
      description: (node.$description as string | undefined) ?? '',
    });
    return out;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith('$')) walk(child, [...trail, key], here, out);
  }
  return out;
}

/** Every token, by its first segment, in the order a reader meets them. */
export function tokenGroups(): { group: string; tokens: Token[] }[] {
  const all = [semantic, light, theme, normal, base].flatMap((doc) => walk(doc));
  const seen = new Set<string>();
  const unique = all.filter((t) => !seen.has(t.path) && seen.add(t.path));
  const order = ['fg', 'bg', 'border', 'syntax', 'ansi', 'palette', 'cell', 'space', 'row', 'size'];
  const groups = new Map<string, Token[]>();
  for (const t of unique) {
    const group = t.path.split('.')[0] ?? '';
    groups.set(group, [...(groups.get(group) ?? []), t]);
  }
  const rank = (g: string) => (order.includes(g) ? order.indexOf(g) : order.length);
  return [...groups]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([group, tokens]) => ({ group, tokens }));
}
