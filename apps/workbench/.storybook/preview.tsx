import { expectConformance, expectContinuity } from '@rockaway/react/testing';
import type { Decorator, Preview } from '@storybook/react-vite';
import '@fontsource-variable/jetbrains-mono';
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';
import { runner } from './runner.ts';

/**
 * Mode and density are runtime contexts (cairn 0058), so the workbench switches
 * them on the root element the same way an app will.
 */
const withContexts: Decorator = (Story, { globals }) => {
  const root = document.documentElement;
  root.dataset.theme = globals.mode;
  root.dataset.density = globals.density;
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
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
  },
  initialGlobals: { mode: 'light', density: 'normal' },
  decorators: [withContexts],
  parameters: {
    layout: 'centered',
    // Every story is an accessibility test: a violation fails the run.
    a11y: { test: 'error' },
  },
};

/**
 * Every story that draws a screen is checked against the grid (cairn 0088).
 * A box off the grid fails here unless it carries a reason, so conformance is
 * not something a component has to remember to assert.
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
    for (const screen of canvasElement.querySelectorAll<HTMLElement>('.rk-screen')) {
      expectConformance(screen);
    }
  }
  const run = runner();
  if (run && parameters.continuity !== false) {
    await expectContinuity(canvasElement, { capture: run.capture });
  }
};

export default preview;
