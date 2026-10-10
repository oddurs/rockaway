import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserInstanceOption, Reporter, Vitest } from 'vitest/node';
import { paintBudget, recordPaint } from './.storybook/budget.ts';
import {
  emulateContrast,
  knownLedger,
  printToPdf,
  readWithoutScripts,
  recordKnown,
  watchdog,
  wheel,
} from './.storybook/commands.ts';
import { densities, modes } from './.storybook/contexts.ts';
import type { Platform } from './.storybook/known.ts';
import { known } from './.storybook/known.ts';
import type { Plan } from './.storybook/matrix.ts';
import { slowStories } from './.storybook/slow.ts';

const configDir = path.join(import.meta.dirname, '.storybook');

/**
 * The platform the browsers run on, for known failures confined to one.
 * From Node, because a browser's user agent is not to be trusted with it:
 * Playwright's WebKit says Macintosh on every platform.
 */
const platform: Platform = process.platform === 'darwin' ? 'Mac' : 'Linux';

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
 * How long a test may run before the watchdog decides the page has stopped
 * answering and closes it (see `.storybook/commands.ts`): a project's own
 * timeout and fifteen seconds more, so a slow test fails on its timeout and
 * only a page that cannot run its timers is closed. Derived, so a timeout
 * raised for one project raises its watchdog with it. Vitest's default
 * timeout is fifteen seconds.
 */
const watchdogAfter = (timeout = 15_000): number => timeout + 15_000;

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
 * too: the frame is 1200 by 2300 (`preview.tsx`), so a screen at touch fits
 * in it, and the page has to hold the frame without scaling it.
 */
const browser = (
  context: Context = {},
  screen: Screen = 'srgb',
  scrollbars = false,
  engine: 'chromium' | 'firefox' | 'webkit' = 'chromium',
) => ({
  enabled: true as const,
  headless: true as const,
  viewport: { width: 1200, height: 900 },
  provider: playwright({
    // Only Chromium can be told what screen it is on, or made to show classic
    // scrollbars.
    ...(engine === 'chromium'
      ? {
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
        }
      : {}),
    contextOptions: { ...context, viewport: { width: 1600, height: 2400 } },
  }),
  instances: [{ browser: engine }] satisfies BrowserInstanceOption[],
  commands: {
    emulateContrast,
    printToPdf,
    readWithoutScripts,
    recordKnown,
    recordPaint,
    watchdog,
    wheel,
  },
});

/**
 * Eight projects. Forced colors is a mode of the browser itself (cairn 0027), so
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
 * Firefox and WebKit are the sixth and seventh (cairn 0124): every story again
 * in each, because the cell is `1ch` by `1lh` and those are exactly the
 * measurements engines disagree on. Forced colours runs in Firefox too, the
 * eighth, which forces them for real (measured: author red on green computes
 * to black on white, and background images go), but not in WebKit, which
 * matches the media query under emulation and still paints the author's
 * colours: Safari has no forced colours mode. Three projects stay Chromium's,
 * each for a reason that is the browser's or the clock's:
 *
 * - p3: only Chromium can be told which screen it is on
 *   (`--force-color-profile`), and the p3 project is that screen;
 * - classic scrollbars: only Chromium's flags can turn overlay scrollbars off;
 * - zoom: twice the device pixels is Chromium's here to keep the run short;
 *   continuity at one device pixel already runs in all three engines.
 *
 * And stories tagged `print` stay out of Firefox and WebKit: Playwright prints
 * to PDF only in Chromium. Stories tagged `native-scrollbars` stay out of
 * Firefox, where Playwright gives every box `scrollbar-width: none` (measured
 * on a plain `overflow: auto` box), so a native bar never appears to be
 * caught; and stories tagged `contrast-emulation` stay out of Firefox, whose
 * emulated `prefers-contrast` matches in matchMedia but never in the style
 * sheets. Those are capabilities a runner lacks; a defect in one engine is a
 * known failure instead (`.storybook/known.ts`), printed in every run until
 * it is fixed.
 *
 * `ENGINES` picks which of the three run, so CI can give Firefox and WebKit a
 * job of their own beside Chromium's. Unset, all three run.
 */
const engines = (process.env.ENGINES ?? 'chromium,firefox,webkit').split(',');
const others = (['firefox', 'webkit'] as const).filter((engine) => engines.includes(engine));
const chromium = engines.includes('chromium');

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
  engine: { densities, modes: [], continuity: 'every', axe: false },
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
      // CI runs one project per job, and cuts the busiest with --shard, so
      // "the whole workbench" is the whole of each project the run names: a
      // run of every file of a project can still find a stale entry, a shard
      // of it cannot.
      const projects = new Set(specifications.map((s) => s.project.name));
      const every = (await vitest.globTestSpecifications()).filter((s) =>
        projects.has(s.project.name),
      );
      partial =
        specifications.length < every.length ||
        vitest.config.testNamePattern !== undefined ||
        vitest.config.shard !== undefined;
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

/** Chromium's projects: the geometry, a p3 screen, forced colors, zoom and classic scrollbars. */
const chromiumProjects = [
  {
    plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS, P3] } })],
    test: {
      name: 'storybook',
      setupFiles,
      testTimeout,
      provide: {
        platform,
        plan: plans.storybook,
        project: 'storybook',
        watchdog: watchdogAfter(testTimeout),
      },
      browser: browser(),
    },
  },
  {
    plugins: [storybookTest({ configDir, tags: { exclude: [FORCED_COLORS] } })],
    test: {
      name: P3,
      setupFiles,
      testTimeout,
      provide: { platform, plan: plans[P3], project: P3, watchdog: watchdogAfter(testTimeout) },
      browser: browser({}, 'display-p3-d65'),
    },
  },
  {
    plugins: [storybookTest({ configDir, tags: { include: [FORCED_COLORS] } })],
    test: {
      name: FORCED_COLORS,
      setupFiles,
      testTimeout,
      provide: {
        platform,
        plan: plans[FORCED_COLORS],
        project: FORCED_COLORS,
        watchdog: watchdogAfter(testTimeout),
      },
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
      provide: { platform, plan: plans.zoom, project: ZOOM, watchdog: watchdogAfter(testTimeout) },
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
      testTimeout,
      provide: { watchdog: watchdogAfter(testTimeout) },
      browser: browser({}, 'srgb', true),
    },
  },
];

/** Firefox and WebKit: every story, but the ones only Chromium can run. */
const engineProjects = others.map((engine) => ({
  plugins: [
    storybookTest({
      configDir,
      tags: {
        exclude: [
          FORCED_COLORS,
          P3,
          'print',
          // A story too large to run in every engine within its timeout on
          // CI, whose parts run everywhere: the kitchen sink's whole-sink
          // variants, whose parts are walked in every engine.
          'chromium-only',
          // Playwright's Firefox gives every box `scrollbar-width: none`, and
          // its emulated `prefers-contrast` never reaches the style sheets.
          ...(engine === 'firefox' ? ['native-scrollbars', 'contrast-emulation'] : []),
        ],
      },
    }),
  ],
  test: {
    name: engine,
    setupFiles,
    testTimeout,
    provide: {
      platform,
      plan: plans.engine,
      project: engine,
      watchdog: watchdogAfter(testTimeout),
    },
    browser: browser({}, 'srgb', false, engine),
  },
}));

/** Forced colours again in Firefox, which implements them. */
const firefoxForcedColors = others.includes('firefox')
  ? [
      {
        plugins: [storybookTest({ configDir, tags: { include: [FORCED_COLORS] } })],
        test: {
          name: `${FORCED_COLORS}-firefox`,
          setupFiles,
          testTimeout,
          provide: {
            platform,
            plan: plans[FORCED_COLORS],
            project: `${FORCED_COLORS}-firefox`,
            watchdog: watchdogAfter(testTimeout),
          },
          browser: browser({ forcedColors: 'active' }, 'srgb', false, 'firefox'),
        },
      },
    ]
  : [];

const config: ViteUserConfig = defineConfig({
  test: {
    reporters: ['default', staleKnown(), slowStories(), paintBudget()],
    projects: [...(chromium ? chromiumProjects : []), ...engineProjects, ...firefoxForcedColors],
  },
});

export default config;
