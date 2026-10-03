import type { UserConfig } from 'tsdown';

const config: UserConfig = {
  // Named entries, so each lands at the path package.json gives it rather than
  // at a name derived from three files all called `index.ts`.
  entry: {
    index: 'src/index.ts',
    'paint/index': 'src/paint/index.ts',
    'testing/index': 'src/testing/index.ts',
    'metadata/index': 'src/metadata/index.ts',
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
