import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserInstanceOption } from 'vitest/node';

const configDir = path.join(import.meta.dirname, '.storybook');

/** The plugin owns `include`, and merges whatever `exclude` it is given. */
const forcedColorsStories = ['**/ForcedColors.stories.tsx'];
const everythingElse = ['**/!(ForcedColors).stories.tsx'];

const browser = (contextOptions?: { forcedColors: 'active' }) => ({
  enabled: true as const,
  headless: true as const,
  provider: playwright(contextOptions ? { contextOptions } : {}),
  instances: [{ browser: 'chromium' }] satisfies BrowserInstanceOption[],
});

/**
 * Two browsers. Forced colors is a mode of the browser itself (cairn 0027), so
 * stories tagged `forced-colors` run in one launched with it active, and
 * nowhere else.
 */
const config: ViteUserConfig = defineConfig({
  test: {
    projects: [
      {
        plugins: [storybookTest({ configDir })],
        test: { name: 'storybook', exclude: forcedColorsStories, browser: browser() },
      },
      {
        plugins: [storybookTest({ configDir })],
        test: {
          name: 'forced-colors',
          exclude: everythingElse,
          browser: browser({ forcedColors: 'active' }),
        },
      },
    ],
  },
});

export default config;
