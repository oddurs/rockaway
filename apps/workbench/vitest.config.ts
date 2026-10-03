import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserInstanceOption } from 'vitest/node';
import { printToPdf } from './.storybook/commands.ts';

const configDir = path.join(import.meta.dirname, '.storybook');

/** Gives every story what only the runner can do: a real screenshot, and a real print. */
const setupFiles = [path.join(configDir, 'vitest.setup.ts')];

/**
 * Stories tagged `zoom` run again at 200%: the continuity matrix, prose, and
 * each component's own continuity stories beside its others.
 */
const ZOOM = 'zoom';

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
const browser = (context: Context = {}, screen: Screen = 'srgb', scrollbars = false) => ({
  enabled: true as const,
  headless: true as const,
  viewport: { width: 1200, height: 900 },
  provider: playwright({
    launchOptions: {
      args: [
        `--force-color-profile=${screen}`,
        // Classic scrollbars, which take room from the box, where the platform has them.
        ...(scrollbars ? ['--disable-features=OverlayScrollbar'] : []),
      ],
      // Playwright hides every scrollbar in headless Chromium, so a native bar
      // measures 0px and nothing could ever see one take a cell's room.
      ...(scrollbars ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {}),
    },
    contextOptions: { ...context, viewport: { width: 1600, height: 1200 } },
  }),
  instances: [{ browser: 'chromium' }] satisfies BrowserInstanceOption[],
  commands: { printToPdf },
});

/**
 * Five browsers. Forced colors is a mode of the browser itself (cairn 0027), so
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
 *
 * Classic scrollbars are the fifth (cairn 0207, 0208). Playwright launches
 * headless Chromium with `--hide-scrollbars`, so in every other run a native
 * scrollbar measures 0px, and a box that would lose fifteen pixels to one in a
 * reader's browser passed. This run drops that flag and turns overlay
 * scrollbars off, so a native bar takes its room as it does with a mouse
 * attached, and stories tagged `classic-scrollbars` run again in it.
 */
const FORCED_COLORS = 'forced-colors';
const P3 = 'p3';
const CLASSIC_SCROLLBARS = 'classic-scrollbars';

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
        plugins: [
          storybookTest({ configDir, tags: { include: [ZOOM], exclude: [FORCED_COLORS, P3] } }),
        ],
        test: {
          name: ZOOM,
          setupFiles,
          browser: browser({ deviceScaleFactor: 2 }),
        },
      },
      {
        plugins: [
          storybookTest({
            configDir,
            tags: { include: [CLASSIC_SCROLLBARS], exclude: [FORCED_COLORS, P3] },
          }),
        ],
        // So a story can tell it is in the run that must show classic bars.
        define: { 'import.meta.env.RK_SCROLLBARS': JSON.stringify('classic') },
        test: {
          name: CLASSIC_SCROLLBARS,
          setupFiles,
          browser: browser({}, 'srgb', true),
        },
      },
    ],
  },
});

export default config;
