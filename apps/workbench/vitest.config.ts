import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserInstanceOption } from 'vitest/node';

const configDir = path.join(import.meta.dirname, '.storybook');

const browser = (contextOptions?: { forcedColors: 'active' }) => ({
  enabled: true as const,
  headless: true as const,
  provider: playwright(contextOptions ? { contextOptions } : {}),
  instances: [{ browser: 'chromium' }] satisfies BrowserInstanceOption[],
});

/**
 * Two browsers. Forced colors is a mode of the browser itself (cairn 0027), so
 * stories tagged `forced-colors` run in one launched with it active, and
 * nowhere else. A tag rather than a file name, so a component keeps its
 * forced-colors story beside its others.
 */
const FORCED_COLORS = 'forced-colors';

const config: ViteUserConfig = defineConfig({
  test: {
    projects: [
      {
        plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS] } })],
        test: { name: 'storybook', browser: browser() },
      },
      {
        plugins: [storybookTest({ configDir, tags: { include: [FORCED_COLORS] } })],
        test: { name: FORCED_COLORS, browser: browser({ forcedColors: 'active' }) },
      },
    ],
  },
});

export default config;
