/**
 * A component is styled from semantic tokens only (rule 5 of the component
 * recipe, 0134; this check is 0252).
 *
 * The semantic tier (`--rk-fg-*`, `--rk-bg-*`, `--rk-border-*`, and the
 * system's own geometry, glyph and motion tokens) is what a theme and a mode
 * re-point. The reference tier underneath it, the terminal's sixteen slots
 * (`--rk-ansi-*`) and each mode's palette (`--rk-palette-*`), is what those
 * aliases point at. A component that reads the reference tier, or writes a
 * colour of its own, keeps that colour when the theme, the mode or forced
 * colours change it. Needing one means a semantic token is missing: add it
 * to @rockaway/tokens first.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import { describe, expect, test } from 'vitest';

const src = path.join(import.meta.dirname, '..', 'src');
const tokensCss = path.join(import.meta.dirname, '..', '..', 'tokens', 'css', 'tokens.css');

/** The reference tier, by the prefix of its custom properties. */
const REFERENCE = /^--rk-(?:ansi|palette)-/;

/** A colour written out rather than read from a token. */
const LITERAL =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|\b(?:black|white|red|green|blue|yellow|cyan|magenta|gray|grey)\b/i;

interface Finding {
  readonly where: string;
  readonly problem: string;
}

function check(sheets: readonly { readonly file: string; readonly css: string }[]): Finding[] {
  const found: Finding[] = [];
  for (const { file, css } of sheets) {
    postcss.parse(css, { from: file }).walkDecls((decl) => {
      const where = `${file}:${decl.source?.start?.line ?? 0}`;
      for (const [, name] of decl.value.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
        if (REFERENCE.test(name ?? '')) {
          found.push({ where, problem: `reads ${name}, a reference token` });
        }
      }
      // Custom properties carry names as well as colours (`--rk-x-tone:
      // red` could be a key), so only the colour a declaration draws with.
      // Token names are taken out first: `--rk-ansi-blue` is not the word blue.
      const value = decl.value.replace(/--[a-z0-9-]+/gi, '');
      const literal = decl.prop.startsWith('--') ? undefined : LITERAL.exec(value)?.[0];
      if (literal !== undefined) {
        found.push({ where, problem: `${decl.prop} writes the colour ${literal}` });
      }
    });
  }
  return found;
}

const components = readdirSync(path.join(src, 'components'))
  .filter((name) => name.endsWith('.css'))
  .sort()
  .map((name) => ({
    file: `components/${name}`,
    css: readFileSync(path.join(src, 'components', name), 'utf8'),
  }));

describe('a component stylesheet reads semantic tokens only', () => {
  test('there are component stylesheets, and a reference tier to keep out of them', () => {
    expect(components.length).toBeGreaterThan(5);
    // The tier is named by prefix here: if the tokens stop defining it under
    // these names, the check would pass on nothing, so it fails instead.
    const defined = new Set<string>();
    postcss.parse(readFileSync(tokensCss, 'utf8')).walkDecls((decl) => {
      if (decl.prop.startsWith('--')) defined.add(decl.prop);
    });
    expect([...defined].some((name) => name.startsWith('--rk-ansi-'))).toBe(true);
    expect([...defined].some((name) => name.startsWith('--rk-palette-'))).toBe(true);
  });

  test('none reads a reference token or writes a colour', () => {
    expect(check(components).map((f) => `${f.where}  ${f.problem}`)).toEqual([]);
  });
});

describe('the check', () => {
  test('fails a reference token, directly or through a custom property, and a literal colour', () => {
    const found = check([
      {
        file: 'x.css',
        css: `
          .rk-x { color: var(--rk-ansi-blue); }
          .rk-x { --rk-x-ink: var(--rk-palette-dark-red, var(--rk-fg-default)); }
          .rk-x { background: #1e1e2e; }
          .rk-x { border-color: oklch(0.5 0.1 200); }
          .rk-x { outline-color: red; }
        `,
      },
    ]);
    expect(found.map((f) => `${f.where}  ${f.problem}`)).toEqual([
      'x.css:2  reads --rk-ansi-blue, a reference token',
      'x.css:3  reads --rk-palette-dark-red, a reference token',
      'x.css:4  background writes the colour #1e1e2e',
      'x.css:5  border-color writes the colour oklch(',
      'x.css:6  outline-color writes the colour red',
    ]);
  });

  test('passes semantic tokens, system colours, and the keywords that are not a colour', () => {
    const found = check([
      {
        file: 'x.css',
        css: `
          .rk-x { color: var(--rk-fg-muted); background: var(--rk-bg-inverse); }
          .rk-x { inline-size: calc(var(--rk-cell-width) * 3); }
          .rk-x { border-color: transparent; outline-color: currentColor; }
          @media (forced-colors: active) { .rk-x { color: CanvasText; } }
          .rk-x { --rk-x-tone: red; }
        `,
      },
    ]);
    expect(found).toEqual([]);
  });
});
