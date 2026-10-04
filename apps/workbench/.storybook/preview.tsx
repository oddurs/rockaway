import { GlyphProvider, OverlayLayer } from '@rockaway/react';
import { expectField, expectNames, expectNoNativeScrollbars } from '@rockaway/react/testing';
import { type ThemeName, themeContexts, themeGlyphs } from '@rockaway/tokens';
import { afterEach as axe } from '@storybook/addon-a11y/preview';
import type { Decorator, Preview, StoryContext } from '@storybook/react-vite';
import '@fontsource-variable/jetbrains-mono';
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';
// Every theme but the default is a stylesheet of its own, loaded after the
// tokens so a theme on the root wins over the root's defaults (cairn 0052).
import '@rockaway/tokens/themes/ice.css';
import '@rockaway/tokens/themes/ink.css';
import '@rockaway/tokens/themes/phosphor.css';
import '@rockaway/tokens/themes/catppuccin.css';
import '@rockaway/tokens/themes/dracula.css';
import '@rockaway/tokens/themes/nord.css';
import '@rockaway/tokens/themes/solarized.css';
import '@rockaway/tokens/themes/tokyo-night.css';
import { setContexts } from './contexts.ts';
import { type Parameters, walk } from './matrix.ts';
import { runner } from './runner.ts';

/**
 * Theme, mode and density are runtime contexts (cairn 0058, 0052), so the
 * workbench switches them on the root element the same way an app will. So is
 * the conformance level (cairn 0072, 0123): an app declares it once, at its
 * root, and every screen in it is held to it. A story about a level pins it
 * with `globals`. The theme's glyphs go through the provider, because chrome
 * is drawn in JavaScript and cannot read them from CSS (0119).
 */
const withContexts: Decorator = (Story, { globals }) => {
  const root = document.documentElement;
  const theme = (globals.theme ?? 'default') as ThemeName;
  setContexts(root, {
    theme,
    mode: globals.mode,
    density: globals.density,
    conformance: globals.conformance,
  });
  return (
    <GlyphProvider glyphs={themeGlyphs[theme]}>
      {/* Overlays open into the canvas, so every check after a story sees them (cairn 0128). */}
      <OverlayLayer>
        <Story />
      </OverlayLayer>
    </GlyphProvider>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: themeContexts.map((theme) => ({ value: theme.name, title: theme.title })),
        dynamicTitle: true,
      },
    },
    mode: {
      description: 'Colour mode',
      toolbar: {
        title: 'Mode',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Density',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'dense', title: 'Dense' },
          { value: 'normal', title: 'Normal' },
          { value: 'airy', title: 'Airy' },
          { value: 'touch', title: 'Touch' },
        ],
        dynamicTitle: true,
      },
    },
    conformance: {
      description: 'How strictly every screen holds the grid (cairn 0072)',
      toolbar: {
        title: 'Conformance',
        icon: 'ruler',
        items: [
          { value: 'strict', title: 'Strict' },
          { value: 'standard', title: 'Standard' },
          { value: 'loose', title: 'Loose' },
        ],
        dynamicTitle: true,
      },
    },
  },
  // `standard` is the default level, and the one every story is held to
  // unless it is about another.
  initialGlobals: { theme: 'default', mode: 'light', density: 'normal', conformance: 'standard' },
  decorators: [withContexts],
  parameters: {
    layout: 'centered',
    // Every story is an accessibility test: a violation fails the run.
    a11y: { test: 'error' },
  },
};

/**
 * Every story that draws a screen is checked against the grid (cairn 0088),
 * at the level the story runs at (cairn 0123). A box off the grid fails here
 * unless it carries a reason, so conformance is not something a component has
 * to remember to assert — and every reason is printed in the run, so the
 * exceptions are counted rather than forgotten.
 *
 * Every painted line is checked for continuity (cairn 0117): a screenshot of
 * each painted layer, read pixel by pixel, to prove that every stroke reaches
 * the edges of its cell and meets its neighbour there. And every target is
 * checked for size (WCAG 2.5.8, rule 8).
 *
 * Then all of it again at every density and in both modes (cairn 0125): the
 * play function ran once, and the geometry is checked in every cell of the
 * matrix this project walks (`matrix.ts`). Every failing cell is collected
 * before the story fails, each named by its density and mode. Only the test
 * runner walks, and only it can read pixels: in the Storybook UI the checks
 * run once, in the context the toolbar shows.
 */
export const afterEach = async (context: StoryContext): Promise<void> => {
  const parameters = context.parameters as Parameters;
  // No native scrollbar is ever drawn (0207). Once, by computed style rather
  // than pixels: a headless browser hides scrollbars, so a bar measures 0px.
  if (parameters.scrollbars !== false) expectNoNativeScrollbars(context.canvasElement);
  // The field contract (cairn 0203) is a question of semantics, not of cells,
  // so it is asked once, in the story's own context, of every field on the page.
  const theme = context.globals.theme as ThemeName | undefined;
  const glyphs = themeGlyphs[theme ?? 'default'];
  if (parameters.fields !== false && context.canvasElement.querySelector('.rk-field')) {
    expectField(context.canvasElement, { glyphs });
  }
  // And outside a field, no name holds a glyph (0252): chrome is drawn, not said.
  if (parameters.names !== false) expectNames(context.canvasElement, { glyphs });
  const run = runner();
  await walk(context.id, context.canvasElement, parameters, {
    capture: run?.capture,
    plan: run?.plan,
    record: run?.record,
    axe: () => axe(context),
  });
};

export default preview;
