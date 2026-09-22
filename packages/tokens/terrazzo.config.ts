import path from 'node:path';
import { defineConfig } from '@terrazzo/cli';
import type { ConfigInit } from '@terrazzo/parser';
import css from '@terrazzo/plugin-css';
import { names } from './scripts/terrazzo-names.ts';

/** Where to write; the staleness check points this at a temporary directory. */
const out = process.env.RK_TOKENS_OUT ?? import.meta.dirname;

const defaults = { mode: 'light', density: 'regular' };

const config: ConfigInit = defineConfig({
  tokens: ['./dtcg/rockaway.resolver.json'],
  outDir: path.join(out, 'css'),
  plugins: [
    css({
      filename: 'tokens.css',
      variableName: (token) => `--rk-${token.id.replace(/\./g, '-')}`,
      permutations: [
        {
          input: defaults,
          prepare: (contents) => `@layer rk.tokens {\n  :root {\n    ${contents}\n  }\n}`,
        },
      ],
    }),
    names({ file: path.join(out, 'src', 'names.ts'), input: defaults }),
  ],
});

export default config;
