import { expectConformance } from '@rockaway/react';
import type { Decorator, Preview } from '@storybook/react-vite';
import '@fontsource-variable/jetbrains-mono';
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';

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
          { value: 'compact', title: 'Compact' },
          { value: 'regular', title: 'Regular' },
          { value: 'comfortable', title: 'Comfortable' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { mode: 'light', density: 'regular' },
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
 */
export const afterEach = ({
  canvasElement,
  parameters,
}: {
  canvasElement: HTMLElement;
  parameters: { conformance?: boolean };
}): void => {
  if (parameters.conformance === false) return;
  for (const screen of canvasElement.querySelectorAll<HTMLElement>('.rk-screen')) {
    expectConformance(screen);
  }
};

export default preview;
