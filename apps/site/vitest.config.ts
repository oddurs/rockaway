import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: {
    name: 'site',
    include: ['test/**/*.test.ts'],
    // The built-site test runs two production builds before it starts.
    hookTimeout: 120_000,
  },
});

export default config;
