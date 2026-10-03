import { defineConfig, type ViteUserConfig } from 'vitest/config';

// `pnpm api:write` rewrites every package's API.md from source, so the merge
// queue can run it with nothing built (cairn 0153).
const fromSource =
  process.env.RK_SOURCE === '1'
    ? {
        resolve: { conditions: ['@rockaway/source'] },
        ssr: { resolve: { conditions: ['@rockaway/source'] } },
      }
    : {};

const config: ViteUserConfig = defineConfig({
  ...fromSource,
  test: { name: 'grid', include: ['test/**/*.test.ts'], setupFiles: ['test/setup.ts'] },
});

export default config;
