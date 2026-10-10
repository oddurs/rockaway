import { defineConfig, type ViteUserConfig } from 'vitest/config';

/** The site's tests: Node tests of its pieces, and browser tests of the export (`out/`). */
const config: ViteUserConfig = defineConfig({
  test: {
    name: 'web',
    include: ['test/**/*.test.ts'],
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});

export default config;
