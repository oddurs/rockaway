import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserInstanceOption, Reporter, Vitest } from 'vitest/node';
import { knownLedger, printToPdf, readWithoutScripts, recordKnown } from './.storybook/commands.ts';
import { densities, modes } from './.storybook/contexts.ts';
import { known } from './.storybook/known.ts';
import type { Plan } from './.storybook/matrix.ts';

const configDir = path.join(import.meta.dirname, '.storybook');

/** Gives every story what only the runner can do: a real screenshot, and a real print. */
const setupFiles = [path.join(configDir, 'vitest.setup.ts')];

/**
 * A story is its play function and then the matrix after it: up to eight
 * cells, five of them with a screenshot read pixel by pixel (cairn 0125). The
 * default fifteen seconds was set for one cell; a story full of frames, read at
 * every density now that each screen follows its context, needs more on CI.
 */
const testTimeout = 60_000;

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
 * story drew — which the continuity check would rightly refuse. It is tall,
 * too: a screen at touch can run past the frame, and the capture grows the
 * frame to hold it (`vitest.setup.ts`), which has to stay inside the page.
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
    contextOptions: { ...context, viewport: { width: 1600, height: 2400 } },
  }),
  instances: [{ browser: 'chromium' }] satisfies BrowserInstanceOption[],
  commands: { printToPdf, readWithoutScripts, recordKnown },
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

/**
 * What each project walks after every story (cairn 0125). Conformance and
 * target size are cheap, so they run in every cell a project walks; pixel
 * continuity and axe are not, so each runs only where its project exists to
 * look.
 *
 * - `storybook` is the geometry: every density in both modes, with the pixels
 *   read across them (every density once, every mode once: five screenshots,
 *   not eight), and axe again in the mode the story did not run in.
 * - `p3` is colour. Its geometry is `storybook`'s, so it walks the modes only,
 *   reads the pixels once, and runs axe in both.
 * - `zoom` and `forced-colors` are about how lines are drawn: every density,
 *   in the story's own mode, which forced colours overrides anyway.
 */
const plans = {
  storybook: { densities, modes, continuity: 'across', axe: true },
  [P3]: { densities: [], modes, continuity: 'own', axe: true },
  zoom: { densities, modes: [], continuity: 'every', axe: false },
  [FORCED_COLORS]: { densities, modes: [], continuity: 'every', axe: false },
} as const satisfies Record<string, Plan>;

/**
 * A known failure that no longer fails is a ticket that landed and an entry
 * nobody removed (cairn 0125): in a run of the whole workbench, it fails the
 * run. A run of part of it may simply not have reached the stories that still
 * fail, so there a stale entry is only a warning.
 */
const staleKnown = (): Reporter => {
  let vitest: Vitest | undefined;
  let partial = false;
  return {
    onInit(instance) {
      vitest = instance;
    },
    async onTestRunStart(specifications) {
      if (!vitest) return;
      const every = await vitest.globTestSpecifications();
      partial = specifications.length < every.length || vitest.config.testNamePattern !== undefined;
    },
    onTestRunEnd() {
      const ledger = knownLedger();
      const stale = known.filter((k) => ledger.inPlay.has(k.id) && !ledger.used.has(k.id));
      const used = known.filter((k) => ledger.used.has(k.id));
      if (used.length > 0) {
        console.info(
          `\nKnown failures still failing (.storybook/known.ts):\n${used.map((k) => `  ${k.id}: ${k.reason}\n    settled by: ${k.ticket}`).join('\n')}`,
        );
      }
      if (stale.length === 0) return;
      const list = stale.map((k) => `  ${k.id}: ${k.ticket}`).join('\n');
      if (partial) {
        console.warn(`\nKnown failures that did not fail in this part of the workbench:\n${list}`);
        return;
      }
      console.error(
        `\nKnown failures that no longer fail; remove them from .storybook/known.ts:\n${list}`,
      );
      process.exitCode = 1;
    },
  };
};

const config: ViteUserConfig = defineConfig({
  test: {
    reporters: ['default', staleKnown()],
    projects: [
      {
        plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS, P3] } })],
        test: {
          name: 'storybook',
          setupFiles,
          testTimeout,
          provide: { plan: plans.storybook },
          browser: browser(),
        },
      },
      {
        plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS] } })],
        test: {
          name: P3,
          setupFiles,
          testTimeout,
          provide: { plan: plans[P3] },
          browser: browser({}, 'display-p3-d65'),
        },
      },
      {
        plugins: [storybookTest({ configDir, tags: { include: [FORCED_COLORS] } })],
        test: {
          name: FORCED_COLORS,
          setupFiles,
          testTimeout,
          provide: { plan: plans[FORCED_COLORS] },
          browser: browser({ forcedColors: 'active' }),
        },
      },
      {
        plugins: [
          storybookTest({ configDir, tags: { include: [ZOOM], exclude: [FORCED_COLORS, P3] } }),
        ],
        test: {
          name: ZOOM,
          setupFiles,
          testTimeout,
          provide: { plan: plans.zoom },
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
