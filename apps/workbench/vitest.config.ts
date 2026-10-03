import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserInstanceOption } from 'vitest/node';
import { printToPdf, readWithoutScripts } from './.storybook/commands.ts';

const configDir = path.join(import.meta.dirname, '.storybook');

/** Gives every story what only the runner can do: a real screenshot, and a real print. */
const setupFiles = [path.join(configDir, 'vitest.setup.ts')];

/** The plugin owns `include`, and merges whatever `exclude` it is given. */
const allButContinuity = ['**/!(Continuity|Prose).stories.tsx'];

interface Context {
  readonly forcedColors?: 'active';
  readonly deviceScaleFactor?: number;
}

/**
 * Chromium takes its colour gamut from the screen, so a Mac's headless run
 * matches `color-gamut: p3` and a Linux runner does not. Each project names
 * its screen instead, so the same stories meet the same colours everywhere.
 */
type Screen = 'srgb' | 'display-p3-d65';

/**
 * The page is bigger than the frame a story runs in. Vitest scales the frame
 * down to fit the page otherwise, and then a screenshot is not the pixels the
 * story drew — which the continuity check would rightly refuse.
 */
const browser = (context: Context = {}, screen: Screen = 'srgb') => ({
  enabled: true as const,
  headless: true as const,
  viewport: { width: 1200, height: 900 },
  provider: playwright({
    launchOptions: { args: [`--force-color-profile=${screen}`] },
    contextOptions: { ...context, viewport: { width: 1600, height: 1200 } },
  }),
  instances: [{ browser: 'chromium' }] satisfies BrowserInstanceOption[],
  commands: { printToPdf, readWithoutScripts },
});

/**
 * Four browsers. Forced colors is a mode of the browser itself (cairn 0027), so
 * stories tagged `forced-colors` run in one launched with it active, and
 * nowhere else. A tag rather than a file name, so a component keeps its
 * forced-colors story beside its others.
 *
 * Zoom is the third: at 200% every CSS pixel is two device pixels, which is all
 * browser zoom does to what is drawn, so the continuity matrix runs again in a
 * browser with twice the pixels and has to meet in every one of them (cairn
 * 0117).
 *
 * p3 is the fourth: every story again on a p3 screen, where the tokens' p3
 * overrides apply and axe measures them as Chromium reports them (cairn 0163).
 * Stories tagged `p3` are about that screen and run only there.
 */
const FORCED_COLORS = 'forced-colors';
const P3 = 'p3';

const config: ViteUserConfig = defineConfig({
  test: {
    projects: [
      {
        plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS, P3] } })],
        test: { name: 'storybook', setupFiles, browser: browser() },
      },
      {
        plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS] } })],
        test: { name: P3, setupFiles, browser: browser({}, 'display-p3-d65') },
      },
      {
        plugins: [storybookTest({ configDir, tags: { include: [FORCED_COLORS] } })],
        test: { name: FORCED_COLORS, setupFiles, browser: browser({ forcedColors: 'active' }) },
      },
      {
        plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS, P3] } })],
        test: {
          name: 'zoom',
          exclude: allButContinuity,
          setupFiles,
          browser: browser({ deviceScaleFactor: 2 }),
        },
      },
    ],
  },
});

export default config;
