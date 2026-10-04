import { readdirSync } from 'node:fs';
import type { UserConfig } from 'tsdown';

/**
 * One entry per component (cairn 0165), found rather than listed, so a new
 * component's entry builds without anyone touching this file. An islands site
 * hydrates `@rockaway/react/frame` and ships a frame, not the package.
 */
const components = Object.fromEntries(
  readdirSync(new URL('./src/entries/', import.meta.url))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => [`entries/${file.slice(0, -3)}`, `src/entries/${file}`]),
);

const config: UserConfig = {
  // Named entries, so each lands at the path package.json gives it rather than
  // at a name derived from three files all called `index.ts`.
  entry: {
    index: 'src/index.ts',
    'paint/index': 'src/paint/index.ts',
    'dom/index': 'src/dom.ts',
    'testing/index': 'src/testing/index.ts',
    'metadata/index': 'src/metadata/index.ts',
    ...components,
  },
  format: 'esm',
  platform: 'neutral',
  // One output module per source module. A bundler drops `'use client'` when it
  // merges modules, and the directive has to stay on each component's own file
  // for a server-component app to treat it as a client boundary.
  unbundle: true,
  // isolatedDeclarations is on, so Oxc can emit declarations without the checker.
  dts: { generator: 'oxc' },
  sourcemap: true,
  inputOptions: {
    // Rolldown warns that it may not keep module-level directives. Unbundled,
    // it does: every component module begins with `'use client'` in dist.
    onLog(level, log, handler) {
      if (log.code === 'MODULE_LEVEL_DIRECTIVE') return;
      handler(level, log);
    },
  },
};

export default config;
