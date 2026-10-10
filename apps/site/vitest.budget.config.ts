import { defineConfig, type ViteUserConfig } from 'vitest/config';

/**
 * The site's budget (cairn 0109): its own run, as a CI job of its own beside
 * the others, rather than a part of `pnpm test`.
 */
const config: ViteUserConfig = defineConfig({
  test: {
    name: 'site-budget',
    include: ['budget/**/*.test.ts'],
    // A production build before it starts, and every page read twice.
    hookTimeout: 180_000,
    testTimeout: 180_000,
    // The numbers are the point: printed on every run, passing or not.
    silent: false,
  },
});

export default config;
