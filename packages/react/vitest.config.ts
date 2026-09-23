import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: { name: 'react', include: ['test/**/*.test.ts'], setupFiles: ['test/setup.ts'] },
});

export default config;
