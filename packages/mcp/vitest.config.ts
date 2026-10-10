import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: {
    name: 'mcp',
    include: ['test/**/*.test.ts'],
    // The stdio test starts the built server as a child process.
    hookTimeout: 30_000,
  },
});

export default config;
