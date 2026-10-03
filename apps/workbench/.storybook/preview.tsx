import { expectConformance, expectContinuity, formatReport } from '@rockaway/react/testing';
import type { Decorator, Preview } from '@storybook/react-vite';
import '@fontsource-variable/jetbrains-mono';
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';
import { runner } from './runner.ts';

/**
 * Mode and density are runtime contexts (cairn 0058), so the workbench switches
 * them on the root element the same way an app will. So is the conformance
 * level (cairn 0072, 0123): an app declares it once, at its root, and every
 * screen in it is held to it. A story about a level pins it with `globals`.
 */
const withContexts: Decorator = (Story, { globals }) => {
  const root = document.documentElement;
  root.dataset.theme = globals.mode;
  root.dataset.density = globals.density;
  root.dataset.rkConformance = globals.conformance;
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
  initialGlobals: { mode: 'light', density: 'normal', conformance: 'standard' },
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
