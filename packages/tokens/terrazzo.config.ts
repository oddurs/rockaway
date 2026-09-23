import path from 'node:path';
import { defineConfig } from '@terrazzo/cli';
import type { ConfigInit } from '@terrazzo/parser';
import css from '@terrazzo/plugin-css';
import { names } from './scripts/terrazzo-names.ts';

/** Where to write; the staleness check points this at a temporary directory. */
const out = process.env.RK_TOKENS_OUT ?? import.meta.dirname;

const defaults = { mode: 'light', density: 'regular' };

/** Tokens that change with mode: the palettes and every alias into them (0016). */
const modeTokens = ['palette.**', 'bg.**', 'fg.**', 'border.**', 'shadow.**'];

/** Tokens that change with density. */
const densityTokens = ['space.**', 'size.**'];

const config: ConfigInit = defineConfig({
  tokens: ['./dtcg/rockaway.resolver.json'],
  outDir: path.join(out, 'css'),
  plugins: [
    css({
      filename: 'tokens.css',
      // Typed custom properties: reference values get a real syntax, aliases
      // stay untyped, so an override like `none` in forced colors still lands.
      propertyDefinitions: true,
      variableName: (token) => `--rk-${token.id.replace(/\./g, '-')}`,
      permutations: [
        // Everything, at the defaults.
        {
          input: defaults,
          prepare: (contents) =>
            `@layer rk.tokens {\n  :root {\n    color-scheme: light;\n    ${contents}\n  }\n}`,
        },
        // Mode islands: only what the mode changes, so an island inside a
        // density island keeps its density. Aliases are re-emitted, so
        // semantic tokens resolve against the island's own palette (0015).
        {
          input: { ...defaults, mode: 'light' },
          include: modeTokens,
          prepare: (contents) =>
            `@layer rk.tokens {\n  [data-theme='light'] {\n    color-scheme: light;\n    ${contents}\n  }\n}`,
        },
        {
          input: { ...defaults, mode: 'dark' },
          include: modeTokens,
          prepare: (contents) =>
            `@layer rk.tokens {\n  @media (prefers-color-scheme: dark) {\n    :root:not([data-theme='light']) {\n      color-scheme: dark;\n      ${contents}\n    }\n  }\n}`,
        },
        {
          input: { ...defaults, mode: 'dark' },
          include: modeTokens,
          prepare: (contents) =>
            `@layer rk.tokens {\n  [data-theme='dark'] {\n    color-scheme: dark;\n    ${contents}\n  }\n}`,
        },
        // Density islands: raw values only, never aliases.
        ...(['compact', 'regular', 'comfortable'] as const).map((density) => ({
          input: { ...defaults, density },
          include: densityTokens,
          prepare: (contents: string) =>
            `@layer rk.tokens {\n  [data-density='${density}'] {\n    ${contents}\n  }\n}`,
        })),
      ],
    }),
    names({ file: path.join(out, 'src', 'names.ts'), input: defaults }),
  ],
});

export default config;
