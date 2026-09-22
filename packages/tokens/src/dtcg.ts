/**
 * The slice of the DTCG 2025.10 format the generator writes.
 * https://www.designtokens.org/tr/drafts/format/
 */
import type { Oklch } from './color.ts';

export type TokenType = 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'number';

export interface ColorValue {
  readonly colorSpace: 'oklch';
  readonly components: readonly [number, number, number];
}

export interface DimensionValue {
  readonly value: number;
  readonly unit: 'px' | 'rem';
}

export interface Token {
  readonly $value: unknown;
  readonly $type?: TokenType;
  readonly $description?: string;
}

/** A group: tokens and nested groups, optionally with an inherited `$type`. */
export interface Group {
  readonly $type?: TokenType;
  readonly $description?: string;
  readonly [name: string]: Token | Group | string | undefined;
}

export function color(value: Oklch): Token {
  const components: [number, number, number] = [value.l, value.c, value.h];
  return { $value: { colorSpace: 'oklch', components } satisfies ColorValue };
}

export function px(value: number): Token {
  return { $value: { value, unit: 'px' } satisfies DimensionValue };
}

/** An alias to another token, by its dot path. */
export function alias(path: string): Token {
  return { $value: `{${path}}` };
}

export interface ResolverDocument {
  readonly $schema: string;
  readonly version: '2025.10';
  readonly name: string;
  readonly description: string;
  readonly sets: Readonly<
    Record<string, { readonly sources: readonly { readonly $ref: string }[] }>
  >;
  readonly modifiers: Readonly<
    Record<
      string,
      {
        readonly description: string;
        readonly contexts: Readonly<Record<string, readonly { readonly $ref: string }[]>>;
        readonly default: string;
      }
    >
  >;
  readonly resolutionOrder: readonly { readonly $ref: string }[];
}
