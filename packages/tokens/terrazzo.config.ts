import path from 'node:path';
import { defineConfig } from '@terrazzo/cli';
import type { ConfigInit } from '@terrazzo/parser';
import css from '@terrazzo/plugin-css';
import { names } from './scripts/terrazzo-names.ts';
import { tailwind } from './scripts/terrazzo-tailwind.ts';
import { themeNames } from './src/themes.ts';

/** Where to write; the staleness check points this at a temporary directory. */
const out = process.env.RK_TOKENS_OUT ?? import.meta.dirname;

const defaults = { theme: 'default', mode: 'light', contrast: 'standard', density: 'normal' };

/** What a theme sets: raw colours for both modes, its type, its glyphs, its conformance (0052). */
const themeTokens = ['palette.**', 'font.**', 'glyph.**', 'conformance'];

/**
 * What has to be declared again wherever the palette changes. A custom
 * property that refers to another is substituted where it is declared, so a
 * theme island re-declares every alias into the palette, and they then resolve
 * against the island's own colours (0015).
 */
const paletteAliases = ['ansi.**', 'bg.**', 'fg.**', 'border.**', 'syntax.**', 'attribute.dim'];

/**
 * What increased contrast changes (0065): the semantic tier, re-read from the
 * same palette, the line weights and the focus ring. A theme island and a
 * `standard` island inside a `more` one re-declare the standard reading.
 */
const contrastTokens = [...paletteAliases.filter((t) => t !== 'ansi.**'), 'stroke.**', 'focus.**'];

/** Every element that sets the reading for its subtree. */
const MORE = "[data-rk-contrast='more']";
const STANDARD = "[data-rk-contrast='standard']";

/** Tokens that change with density. */
const densityTokens = ['cell.**', 'space.**', 'row.**', 'size.**'];

const layer = (body: string) => `@layer rk.tokens {\n${body}\n}`;
const rule = (selector: string, contents: string) => `  ${selector} {\n    ${contents}\n  }`;

const variableName = (token: { id: string }) => `--rk-${token.id.replace(/\./g, '-')}`;

/**
 * One stylesheet per theme other than the default, scoped to its attribute:
 * `@rockaway/tokens/themes/ink.css` is `[data-rk-theme='ink']`. A theme with a
 * single mode pins it, for itself and for any mode island inside it.
 */
function themeSheet(name: string) {
  return css({
    filename: `themes/${name}.css`,
    propertyDefinitions: false,
    omitTypographyShorthand: true,
    variableName,
    permutations: [
      {
        input: { ...defaults, theme: name },
        include: themeTokens,
        prepare: (contents: string) => layer(rule(`[data-rk-theme='${name}']`, contents)),
      },
    ],
  });
}

const config: ConfigInit = defineConfig({
  tokens: ['./dtcg/rockaway.resolver.json'],
  outDir: path.join(out, 'css'),
  plugins: [
    css({
      filename: 'tokens.css',
      // Typed custom properties: reference values get a real syntax, aliases
      // stay untyped, so an override like `none` in forced colors still lands.
      propertyDefinitions: true,
      // No `font` shorthand: it is legal CSS that minifiers refuse to parse
      // when the value is a var() (cairn 0066). The parts are emitted anyway.
      omitTypographyShorthand: true,
      variableName,
      permutations: [
        // Everything, at the defaults. `ansi.*` comes out as an alias into the
        // light half of the palette; the build rewrites it to `light-dark()`
        // over both halves, so the mode is the element's `color-scheme`.
        {
          input: defaults,
          prepare: (contents) => layer(rule(':root', `color-scheme: light dark;\n    ${contents}`)),
        },
        // A theme island re-declares the aliases, so they read its palette;
        // so does an island that asks for the standard contrast back (0065).
        {
          input: defaults,
          include: [...paletteAliases, 'stroke.**', 'focus.**'],
          prepare: (contents) => layer(rule(`[data-rk-theme],\n  ${STANDARD}`, contents)),
        },
        // Increased contrast, asked for on an element, and re-declared on
        // every theme island inside it (0065).
        {
          input: { ...defaults, contrast: 'more' },
          include: contrastTokens,
          prepare: (contents) => layer(rule(`${MORE},\n  ${MORE} [data-rk-theme]`, contents)),
        },
        // Increased contrast from the reader's system, unless the page says
        // standard: on the root, and on every theme island not inside a
        // standard one.
        {
          input: { ...defaults, contrast: 'more' },
          include: contrastTokens,
          prepare: (contents) =>
            `@layer rk.tokens {\n  @media (prefers-contrast: more) {\n    :root:not(${STANDARD}),\n    :root:not(${STANDARD}) [data-rk-theme]:not(${STANDARD}, ${STANDARD} *) {\n      ${contents}\n    }\n  }\n}`,
        },
        // The default theme as an island of its own, for inside another theme.
        {
          input: defaults,
          include: themeTokens,
          prepare: (contents) => layer(rule(`[data-rk-theme='default']`, contents)),
        },
        // Density islands: raw values only, never aliases.
        ...(['dense', 'normal', 'airy', 'touch'] as const).map((density) => ({
          input: { ...defaults, density },
          include: densityTokens,
          prepare: (contents: string) => layer(rule(`[data-density='${density}']`, contents)),
        })),
      ],
    }),
    ...themeNames.filter((name) => name !== 'default').map(themeSheet),
    names({ file: path.join(out, 'src', 'names.ts'), input: defaults }),
    tailwind({ file: path.join(out, 'css', 'tailwind.css'), input: defaults }),
  ],
});

export default config;
