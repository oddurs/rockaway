import { defineConfig, type ViteUserConfig } from 'vitest/config';

// The stylesheet is checked against the engine's source, never against a
// stale build of it.
const config: ViteUserConfig = defineConfig({
  resolve: { conditions: ['@rockaway/source'] },
  ssr: { resolve: { conditions: ['@rockaway/source'] } },
  test: { name: 'css', include: ['test/**/*.test.ts'] },
});

export default config;
