/**
 * Everything reversed opts out of the forced-colors backplate (cairn 0181, 0201).
 *
 * In forced colors, Chromium paints a canvas-coloured backplate behind every
 * line of text unless the element opts out with `forced-color-adjust: none`.
 * Reversed words are drawn in a ground colour, the canvas there, so on that
 * plate they vanish. The opt-outs are listed by hand, so this test finds
 * every rule that reverses and fails if no opt-out covers it.
 *
 * A rule reverses when it draws words in a ground colour: its `color` reads a
 * `--rk-bg-*` token or an `--rk-fg-on-*` one (the text that sits on a fill),
 * directly or through a custom property of its own that a `color` reads.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postcss, { type AtRule, type Node, type Rule } from 'postcss';
import { describe, expect, test } from 'vitest';

const src = path.join(import.meta.dirname, '..', 'src');

/** A ground colour, as a token a `color` could read. */
const GROUND = /var\(\s*--rk-(?:bg-[a-z0-9-]+|fg-on-[a-z0-9-]+)\s*[,)]/;

interface Found {
  /** Rules that draw words in a ground colour, by full selector, with where. */
  readonly reversing: readonly { readonly selector: string; readonly where: string }[];
  /** Selectors that opt out of the adjustment under forced colors. */
  readonly optOuts: readonly string[];
}

/** Each selector a rule applies to, its parents' prepended, list split. */
function selectorsOf(rule: Rule): string[] {
  const parents: string[] = [];
  for (let node: Node | undefined = rule.parent; node; node = node.parent) {
    if (node.type === 'rule') parents.unshift((node as Rule).selector);
  }
  return rule.selectors.map((one) => [...parents, one].join(' ').replace(/\s+/g, ' '));
}

function inForcedColors(node: Node): boolean {
  for (let parent: Node | undefined = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && /forced-colors\s*:\s*active/.test((parent as AtRule).params)) {
      return true;
    }
  }
  return false;
}

/** What the stylesheets reverse, and what opts out. */
function scan(sheets: readonly { readonly file: string; readonly css: string }[]): Found {
  const reversing: { selector: string; where: string }[] = [];
  const optOuts: string[] = [];
  for (const { file, css } of sheets) {
    const root = postcss.parse(css, { from: file });
    // The sheet's own custom properties that some `color` reads.
    const inks = new Set<string>();
    root.walkDecls('color', (decl) => {
      for (const [, name] of decl.value.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) inks.add(name ?? '');
    });
    root.walkRules((rule) => {
      let reverses = false;
      let optsOut = false;
      rule.each((child) => {
        if (child.type !== 'decl') return;
        if ((child.prop === 'color' || inks.has(child.prop)) && GROUND.test(child.value)) {
          reverses = true;
        }
        if (child.prop === 'forced-color-adjust' && child.value.trim() === 'none') optsOut = true;
      });
      if (reverses && !inForcedColors(rule)) {
        for (const selector of selectorsOf(rule)) {
          reversing.push({ selector, where: `${file}:${rule.source?.start?.line ?? 0}` });
        }
      }
      if (optsOut && inForcedColors(rule)) optOuts.push(...selectorsOf(rule));
    });
  }
  return { reversing, optOuts };
}

/**
 * The simple selectors of a selector's last compound: `.a[b="c"]:hover` is
 * three. Combinators inside brackets and parentheses (`[a~="b"]`,
 * `:where(a b)`) are not combinators.
 */
function compound(selector: string): Set<string> {
  let depth = 0;
  let last = '';
  for (const ch of selector.trim()) {
    if (ch === '[' || ch === '(') depth++;
    if (ch === ']' || ch === ')') depth--;
    last = depth === 0 && /[\s>+~]/.test(ch) ? '' : last + ch;
  }
  const parts =
    last.match(/\.[\w-]+|#[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?|^[a-z*][\w-]*/gi) ?? [];
  return new Set(parts.map((part) => part.replace(/["']/g, '').replace(/\s+/g, '')));
}

/** An opt-out covers a rule when every part of its compound is in the rule's. */
function covered(selector: string, optOuts: readonly string[]): boolean {
  const rule = compound(selector);
  return optOuts.some((optOut) => {
    const parts = [...compound(optOut)];
    return parts.length > 0 && parts.every((part) => rule.has(part));
  });
}

function uncovered(found: Found): string[] {
  return found.reversing
    .filter(({ selector }) => !covered(selector, found.optOuts))
    .map(({ selector, where }) => `${where}  ${selector}`);
}

const sheets = readdirSync(src, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
  .map((entry) => path.join(entry.parentPath, entry.name))
  .sort()
  .map((file) => ({ file: path.relative(src, file), css: readFileSync(file, 'utf8') }));

describe('every reversed thing opts out of the forced-colors backplate', () => {
  const found = scan(sheets);

  test('finds the reversing rules there are', () => {
    // A floor, so a check that stopped finding anything could not pass.
    const selectors = found.reversing.map((r) => r.selector);
    expect(selectors).toContain('[data-attrs~="reverse"]');
    expect(selectors).toContain('.rk-button[data-pressed]');
    expect(selectors).toContain('.rk-list-item[data-selected]');
    expect(selectors).toContain('.rk-link[data-pressed]');
  });

  test('every one is covered by an opt-out', () => {
    expect(uncovered(found)).toEqual([]);
  });
});

describe('the check', () => {
  const fixture = (css: string): string[] =>
    uncovered(
      scan([
        { file: 'x.css', css },
        {
          file: 'forced-colors.css',
          css: '@media (forced-colors: active) { .rk-x[data-pressed], [data-y~="z"] { forced-color-adjust: none; } }',
        },
      ]),
    );

  test('fails a reversal with no opt-out, directly or through a custom property', () => {
    expect(
      fixture(`
        .rk-x[data-selected] { background: var(--rk-fg-default); color: var(--rk-bg-page); }
        .rk-z { --rk-z-ink: var(--rk-fg-default); color: var(--rk-z-ink); }
        .rk-z[data-tone="solid"] { --rk-z-ink: var(--rk-fg-on-accent); }
        .rk-w[data-y] { color: var(--rk-fg-on-inverse); }
      `),
    ).toEqual([
      'x.css:2  .rk-x[data-selected]',
      'x.css:4  .rk-z[data-tone="solid"]',
      // The opt-out is for [data-y~="z"]: the `~` inside it is not a combinator.
      'x.css:5  .rk-w[data-y]',
    ]);
  });

  test('passes one an opt-out covers, a narrower selector, and words in a figure colour', () => {
    expect(
      fixture(`
        .rk-x[data-pressed] { color: var(--rk-fg-on-inverse); }
        .rk-x[data-variant="fill"][data-pressed] { color: var(--rk-bg-page); }
        .w [data-y~="z"]:hover { color: var(--rk-bg-surface); }
        .rk-x { color: var(--rk-fg-default); background: var(--rk-bg-subtle); }
      `),
    ).toEqual([]);
  });
});
