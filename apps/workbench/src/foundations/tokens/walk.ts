/**
 * Reads the generated DTCG files, so the reference can never drift from the
 * tokens it documents (cairn 0023).
 */
import base from '@rockaway/tokens/dtcg/base.tokens.json';
import normal from '@rockaway/tokens/dtcg/density.normal.tokens.json';
import light from '@rockaway/tokens/dtcg/palette.light.tokens.json';
import semantic from '@rockaway/tokens/dtcg/semantic.tokens.json';

type Node = Record<string, unknown>;

export interface TokenEntry {
  /** DTCG path, e.g. `fg.muted`. */
  readonly path: string;
  /** The CSS custom property, e.g. `--rk-fg-muted`. */
  readonly cssVar: string;
  readonly type: string | undefined;
  readonly value: unknown;
  readonly description: string | undefined;
}

export function entries(doc: unknown, trail: string[] = [], inherited?: string): TokenEntry[] {
  const node = doc as Node;
  const type = (node.$type as string | undefined) ?? inherited;
  if ('$value' in node) {
    const path = trail.join('.');
    return [
      {
        path,
        cssVar: `--rk-${path.replace(/\./g, '-')}`,
        type,
        value: node.$value,
        description: node.$description as string | undefined,
      },
    ];
  }
  return Object.entries(node)
    .filter(([k]) => !k.startsWith('$'))
    .flatMap(([k, child]) => entries(child, [...trail, k], type));
}

export function group(doc: unknown, name: string): TokenEntry[] {
  return entries((doc as Node)[name], [name]);
}

/** The alias target, e.g. `palette.neutral.12`, or undefined for a raw value. */
export function aliasOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.startsWith('{') ? value.slice(1, -1) : undefined;
}

export const docs = { base, normal, light, semantic };
