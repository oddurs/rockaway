import { GlyphProvider } from '@rockaway/react';
import { expectConformance, expectContinuity, formatReport } from '@rockaway/react/testing';
import { type ThemeName, themeContexts, themeGlyphs } from '@rockaway/tokens';
import type { Decorator, Preview } from '@storybook/react-vite';
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
  root.dataset.rkTheme = theme;
  root.dataset.theme = globals.mode;
  root.dataset.density = globals.density;
  root.dataset.rkConformance = globals.conformance;
  return (
    <GlyphProvider glyphs={themeGlyphs[theme]}>
      <Story />
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
 * And every painted line is checked for continuity (cairn 0117): a screenshot
 * of each painted layer, read pixel by pixel, to prove that every stroke
 * reaches the edges of its cell and meets its neighbour there. Only the test
 * runner can take the screenshot, so the Storybook UI skips this half.
 */
export const afterEach = async ({
  canvasElement,
  parameters,
}: {
  canvasElement: HTMLElement;
  parameters: { conformance?: boolean; continuity?: boolean };
}): Promise<void> => {
  if (parameters.conformance !== false) {
    // Every screen in one pass, so an exception inside nested screens is
    // counted once.
    const report = expectConformance(canvasElement);
    if (report.exceptions.length > 0) console.info(formatReport(report));
  }
  const run = runner();
  if (run && parameters.continuity !== false) {
    await expectContinuity(canvasElement, { capture: run.capture });
  }
};

export default preview;
